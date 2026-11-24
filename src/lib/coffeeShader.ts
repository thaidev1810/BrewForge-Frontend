/* Procedural coffee scenes rendered in a single fragment shader.
   The scene is picked from the seed: 0 latte art (rosetta / heart), 1 roasted beans, 2 espresso crema,
   3 cream swirling into coffee, 4 iced cold brew. Colours come from a four-stop palette (dark, roast, crema, cream). */
export const COFFEE_VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'

export const COFFEE_FS = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;uniform float uTime;uniform float uSeed;uniform float uMix;uniform float uZoom;uniform vec3 uPA[4];uniform vec3 uPB[4];
float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),u.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){v+=a*n(p);p=m*p;a*=.5;}return v;}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float sdHeart(vec2 p){
 p.x=abs(p.x);
 if(p.y+p.x>1.){vec2 d=p-vec2(.25,.75);return sqrt(dot(d,d))-.35355339;}
 vec2 a=p-vec2(0.,1.);vec2 b=p-.5*max(p.x+p.y,0.);
 return sqrt(min(dot(a,a),dot(b,b)))*sign(p.x-p.y);
}
float sdBox(vec2 p,vec2 b,float r){vec2 d=abs(p)-b+r;return length(max(d,0.))+min(max(d.x,d.y),0.)-r;}
vec3 C0,C1,C2,C3;
vec2 LD;
vec3 table(vec2 p,float seed){
 float g=fbm(vec2(p.x*1.6+seed,p.y*34.));
 float g2=fbm(p*2.6+seed*1.7);
 vec3 col=mix(C0*.5,C1*.62,g2);
 col+=(g-.5)*.07*C2;
 return col;
}
/* ceramic: lit from top-left, q = vector from cup centre */
vec3 ceramic(vec2 q,float r,float base){
 float d=dot(normalize(q+1e-5),LD);
 vec3 c=C3*vec3(1.,.97,.93);
 return c*(base+.14*d*smoothstep(.1,.45,r));
}
vec3 cupScene(vec2 p,float seed,float t,float kind){
 vec3 col=table(p,seed);
 vec2 c=vec2(.0,.01);
 vec2 q=p-c;float r=length(q);
 /* soft shadows */
 float sh=length(q-vec2(.03,-.045));
 col*=1.-.6*smoothstep(.56,.40,sh);
 /* saucer */
 float RS=.46,RR=.335,RI=.285,RC=.262;
 if(r<RS){
  vec3 s=ceramic(q,r,.84);
  s*=1.-.2*smoothstep(RS-.05,RS,r)*0.0;
  float well=smoothstep(.40,.34,r);
  s*=1.-.18*well;
  s*=.9+.1*smoothstep(RS,RS-.02,r);
  col=mix(col,s,smoothstep(RS,RS-.004,r));
  /* rim highlight line */
  col+=C3*.18*smoothstep(.006,.0,abs(r-RS+.006))*max(dot(normalize(q+1e-5),LD),0.);
  /* cup shadow on saucer */
  col*=1.-.42*smoothstep(.40,.31,length(q-vec2(.018,-.026)))*step(RR*0.0,r);
 }
 if(r<RR+.004){
  /* cup rim + inner wall */
  vec3 rim=ceramic(q,r,.95);
  vec3 wall=ceramic(-q,r,.62)*(.8+.35*smoothstep(RC,RI,r));
  float inWall=smoothstep(RI-.004,RI+.004,r);
  vec3 cc=mix(wall,rim,inWall);
  col=mix(col,cc,smoothstep(RR+.004,RR-.003,r));
  /* rim specular */
  float sp=pow(max(dot(normalize(q+1e-5),LD),0.),10.)*smoothstep(.02,0.,abs(r-(RR+RI)*.5))*.7;
  col+=vec3(1.)*sp;
 }
 if(r<RC+.004){
  float u=r/RC;
  vec3 liq;
  float foamMask=0.;
  if(kind<.5){ /* latte: brown crema ring + milk art */
   vec3 crema=mix(C1*.92,C2*1.02,smoothstep(.0,1.,fbm(q*14.+seed)));
   crema*=.72+.38*smoothstep(1.,.2,u);
   liq=crema;
   float ang=-.35+.1*sin(t*.25+seed)+(h(vec2(seed,3.1))-.5)*.5;
   vec2 a=rot(ang)*q/(RC*.9);
   if(mod(floor(uSeed+.5),2.)<.5){
    /* rosetta: curved leaf bands tapering to a point */
    float v=a.x,w=a.y;
    float wob=.05*sin(w*4.+seed*1.3);
    float tt=clamp((w+.86)/1.62,0.,1.);
    float W=.86*pow(sin(3.14159*pow(tt,.78)),.7);
    float edge=smoothstep(W,W-.07,abs(v+wob));
    float s2=w*1.0+.95*(v+wob)*(v+wob)*(1.-.35*tt);
    float bands=sin(s2*30.+.6);
    float stripe=smoothstep(-.35,-.05,bands);
    foamMask=edge*stripe;
    float stem=smoothstep(.03,.0,abs(v+wob))*smoothstep(-.55,-.3,w);
    foamMask*=1.-stem*.85;
    foamMask*=smoothstep(.0,.05,tt)*smoothstep(1.,.93,tt);
    foamMask=clamp(foamMask,0.,1.);
   }else{
    /* nested hearts */
    vec2 hp=vec2(a.x,a.y+.78)/1.05;
    float d=sdHeart(vec2(hp.x,hp.y));
    float rings=.5+.5*sin(d*24.-1.2);
    float inside=smoothstep(.02,-.02,d);
    foamMask=inside*smoothstep(.28,.5,rings);
    foamMask+=inside*smoothstep(.2,.0,d+.0)*0.0;
    float pull=smoothstep(.03,.0,abs(hp.x))*smoothstep(-.1,.7,hp.y)*smoothstep(1.05,.75,hp.y);
    foamMask*=1.-pull*.85;
    foamMask=clamp(foamMask,0.,1.);
   }
   vec3 foam=mix(C3*.97,C3,fbm(q*30.));
   liq=mix(liq,foam,foamMask*.96);
  }else{ /* espresso: tiger crema */
   float a=atan(q.y,q.x);
   vec2 dir=vec2(cos(a),sin(a));
   float sw=fbm(dir*1.6+vec2(u*6.+t*.1,u*4.+seed));
   float sw2=fbm(dir*1.6*rot(u*3.)[0]+vec2(u*3.,t*.05));
   float tig=fbm(dir*3.4+vec2(u*11.+sw*3.,u*7.));
   vec3 cr=mix(C1*.8,C2,smoothstep(.25,.75,sw));
   cr=mix(cr,C2*1.12+.04,smoothstep(.5,.9,tig)*.6);
   cr=mix(cr,C1*.7,smoothstep(.45,.2,sw2)*.35);
   cr*=.62+.5*smoothstep(1.,.15,u);
   cr=mix(cr,C1*.5,smoothstep(.25,.0,u)*.55);
   liq=cr;
  }
  /* meniscus + glossy window reflection */
  liq*=.7+.3*smoothstep(1.,.86,u);
  float gl=exp(-dot(q-vec2(-.1,.1),q-vec2(-.1,.1))*130.);
  liq+=C3*.14*gl;
  liq+=C3*.07*smoothstep(.04,.0,abs(u-.93))*max(dot(normalize(q+1e-5),LD),0.);
  col=mix(col,liq,smoothstep(RC+.004,RC-.003,r));
 }
 if(kind<.5){
  /* spoon on the saucer */
  vec2 sp=rot(.9)*(p-c-vec2(.2,-.33));
  float spoon=sdBox(sp,vec2(.17,.011),.01);
  float bowl=length(sp*vec2(1.,1.35)-vec2(-.19,0.))-.04;
  float s2=min(spoon,bowl);
  vec3 steel=mix(C3*.55,C3,.5+.5*sin(sp.x*7.+1.));
  col*=1.-.4*smoothstep(.05,.0,s2-.012);
  col=mix(col,steel,smoothstep(.003,-.003,s2));
 }
 return col;
}
vec3 beans(vec2 p,float seed,float t){
 vec2 g=rot(.4+seed*.37)*p*7.;
 g+=vec2(t*.01,0.);
 vec2 ic=floor(g);
 vec3 col=C0*.28;
 float best=-1.;
 for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
  vec2 cell=ic+vec2(float(i),float(j));
  vec2 hh=vec2(h(cell+seed),h(cell+seed+7.3));
  vec2 c=cell+.5+(hh-.5)*.5;
  float a=h(cell+seed*2.+3.1)*6.2831;
  vec2 l=rot(a)*(g-c);
  float e=length(l/vec2(.56,.37));
  float z=h(cell+11.7+seed);
  if(e<1.&&z>best){
   best=z;
   vec3 nr=normalize(vec3(l.x/.56,l.y/.37,.55+.6*sqrt(max(1.-e*e,0.))));
   float df=dot(nr,normalize(vec3(-.45,.6,.65)));
   float cr=abs(l.y-.12*sin(l.x*5.));
   float crease=smoothstep(.07,.02,cr)*smoothstep(.55,.4,abs(l.x));
   vec3 bc=mix(C1*.85,C2*.9,hh.x*.6+.15*z);
   bc*=.3+1.0*clamp(df,0.,1.);
   bc=mix(bc,C0*.25,crease*.88);
   bc+=C3*.18*pow(clamp(df,0.,1.),14.)*(1.-crease);
   bc*=.55+.45*smoothstep(1.,.55,e);
   col=bc;
  }
 }
 return col;
}
vec3 creamSwirl(vec2 p,float seed,float t){
 vec2 q0=p*1.7+vec2(seed*3.17,seed*1.71);
 float tt=t*.05;
 vec2 q=vec2(fbm(q0+vec2(0.,tt)),fbm(q0+vec2(5.2,1.3)-tt*.8));
 vec2 r=vec2(fbm(q0+2.6*q+vec2(1.7,9.2)+.18*tt),fbm(q0+2.6*q+vec2(8.3,2.8)-.14*tt));
 float f=fbm(q0+2.2*r);
 float m=f*4.2+r.x*1.5;
 float band=abs(fract(m)-.5)*2.;
 float cream=smoothstep(.34,.2,band);
 float edge=smoothstep(.5,.34,band)-smoothstep(.34,.2,band);
 vec3 coffee=mix(C0*.9,C1,smoothstep(.2,.8,f));
 coffee=mix(coffee,C2*.85,smoothstep(.55,.95,length(q))*.7);
 vec3 col=mix(coffee,mix(C2*1.08,C3,.75),cream);
 col=mix(col,C2*.9,edge*.45);
 col*=.8+.35*f;
 float lig=pow(max(1.-band,0.),3.)*cream;
 col+=C3*.1*lig;
 vec2 lp=p-vec2(-.2,.22);col+=C3*.09*exp(-dot(lp,lp)*9.);
 return col;
}
vec3 iced(vec2 p,float seed,float t){
 vec3 col=table(p,seed);
 vec2 c=vec2(.0,.0);
 vec2 q=p-c;float r=length(q);
 float RG=.38;
 col*=1.-.55*smoothstep(.52,.34,length(q-vec2(.04,-.05)));
 if(r<RG+.005){
  float u=r/RG;
  float fm=fbm(q*5.+seed);
  vec3 liq=mix(C1*.8,C2,smoothstep(.15,.75,fm));
  liq*=.55+.65*smoothstep(.0,1.,1.-u*.7);
  float wisp=fbm(vec2(q.x*4.+t*.04,q.y*7.-t*.05)+seed*3.)+.35*fbm(q*14.+t*.02);
  liq=mix(liq,C3*.95,smoothstep(.56,.8,wisp)*.62*smoothstep(1.,.5,u));
  for(int k=0;k<5;k++){
   float fk=float(k);
   vec2 pc=vec2(cos(fk*1.9+seed*2.+t*.012),sin(fk*2.3+seed*3.))*.17*(.35+.65*h(vec2(fk,seed)));
   float ang=h(vec2(fk,seed+3.))*3.14+t*.02;
   vec2 l=rot(ang)*(q-pc);
   float d=sdBox(l,vec2(.085+.025*h(vec2(fk+9.,seed))),.026);
   float inb=smoothstep(.003,-.003,d);
   vec3 ic=mix(liq*1.18+.03,C3,.2);
   float rimh=smoothstep(.014,.0,abs(d+.007))*(.5+.5*dot(normalize(l+1e-4),vec2(-.7,.7)));
   ic+=C3*.35*rimh;
   ic+=C3*.2*smoothstep(.03,.0,abs(l.x+l.y*.6+.02))*inb;
   liq=mix(liq,ic,inb*.8);
   liq*=1.-.25*smoothstep(.03,.0,d)*(1.-inb);
  }
  vec3 gcol=liq;
  float wallW=smoothstep(.9,1.,u);
  gcol=mix(gcol,C3*.75,wallW*.35);
  gcol+=C3*.25*smoothstep(.03,.0,abs(u-.985))*max(dot(normalize(q+1e-5),LD),0.);
  gcol+=C3*.08*exp(-dot(q-vec2(-.15,.17),q-vec2(-.15,.17))*60.);
  float cond=smoothstep(.76,.86,h(floor(q*180.)))*.0;
  col=mix(col,gcol,smoothstep(RG+.004,RG-.003,r));
  float rimR=smoothstep(.006,.0,abs(r-RG));
  col+=C3*.28*rimR*(.4+.6*max(dot(normalize(q+1e-5),LD),0.));
 }
 /* straw */
 vec2 sp=q-vec2(.1,.12);
 float sr=length(sp);
 float st=smoothstep(.04,.036,sr)-smoothstep(.028,.024,sr);
 col=mix(col,C3*.92,st);
 col=mix(col,C0*.35,smoothstep(.026,.022,sr));
 return col;
}
void main(){
 C0=mix(uPA[0],uPB[0],uMix);C1=mix(uPA[1],uPB[1],uMix);C2=mix(uPA[2],uPB[2],uMix);C3=mix(uPA[3],uPB[3],uMix);
 LD=normalize(vec2(-.6,.75));
 vec2 uv=gl_FragCoord.xy/uRes;
 vec2 p=(gl_FragCoord.xy-.5*uRes)/min(uRes.x,uRes.y);
 p/=(1.+(uZoom-1.)*.28);
 float sd=floor(uSeed+.5);
 float v=mod(sd,5.);
 float t=uTime;
 vec3 col;
 if(v<.5)col=cupScene(p,uSeed,t,0.);
 else if(v<1.5)col=beans(p,uSeed,t);
 else if(v<2.5)col=cupScene(p,uSeed,t,1.);
 else if(v<3.5)col=creamSwirl(p,uSeed,t);
 else col=iced(p,uSeed,t);
 vec2 vq=uv-.5;col*=1.-.5*dot(vq,vq)*1.6;
 vec2 lp=uv-vec2(.74,.86);col+=C3*.05*exp(-dot(lp,lp)*6.);
 col=col*1.04;
 col+=(h(gl_FragCoord.xy+fract(uTime*3.7)*91.)-.5)*.045;
 gl_FragColor=vec4(clamp(col,0.,1.),1.);
}
`
