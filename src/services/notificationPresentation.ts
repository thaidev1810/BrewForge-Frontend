import { displayField } from '@/components/common/presentation'
const titles:Record<string,string>={ 'Course assigned':'Bạn được giao khóa học', 'Course reset':'Lần học được mở lại', 'Course overdue':'Khóa học đã quá hạn', 'Course due soon':'Khóa học sắp đến hạn', 'Class cancelled':'Lớp học đã hủy', 'Certificate issued':'Đã cấp chứng chỉ', 'Enrolment locked':'Lần học bị khóa', 'Practical scheduled':'Đã đặt lịch thực hành', 'Practical rescheduled':'Lịch thực hành đã thay đổi', 'Practical cancelled':'Đã hủy lịch thực hành', 'Drink withdrawn':'Đồ uống đã ngừng bán' }
Object.assign(titles,{'Training needed for a drink':'Cần đào tạo cho đồ uống','Branch ready to open a drink':'Chi nhánh đủ điều kiện mở bán','Drink on sale':'Đồ uống đã mở bán','Pilot ended':'Thử nghiệm đã kết thúc','Sales missing':'Còn thiếu doanh số'})
export function notificationTitle(subject:string):string {return titles[subject]??subject}
export function notificationBody(subject:string,message:string):string {
  let match:RegExpMatchArray|null
  if(subject==='Course due soon'&&(match=message.match(/^'(.+)' is due on (\d{4}-\d{2}-\d{2})\.$/))) return `Khóa “${match[1]}” đến hạn ngày ${displayField('dueDate',match[2])}. Mở danh sách khóa học để tiếp tục bài còn thiếu.`
  if(subject==='Course overdue'&&(match=message.match(/^'(.+)' was due on (\d{4}-\d{2}-\d{2})\. Finish it as soon as you can\.$/)))return `Khóa “${match[1]}” đã quá hạn từ ngày ${displayField('dueDate',match[2])}. Tiếp tục hoàn thành khóa học và trao đổi với quản lý nếu cần hỗ trợ.`
  if(subject==='Course overdue'&&(match=message.match(/^Enrolment (\d+) on '(.+)' was due on (\d{4}-\d{2}-\d{2}) and is not finished\.$/)))return `Lần học số ${match[1]} của khóa “${match[2]}” chưa hoàn thành, đã đến hạn ngày ${displayField('dueDate',match[3])}. Kiểm tra tiến độ trong danh sách giao khóa.`
  if(subject==='Certificate issued'&&(match=message.match(/^You are now certified on '(.+)'\.$/)))return `Bạn đã đạt chứng chỉ cho khóa “${match[1]}”. Mở danh sách chứng chỉ để xem tình trạng hiệu lực.`
  if(subject==='Course assigned'&&(match=message.match(/^'(.+)' is part of your training path\. Due (\d{4}-\d{2}-\d{2})\.$/)))return `Bạn được giao khóa “${match[1]}” trong lộ trình học. Hạn hoàn thành: ${displayField('dueDate',match[2])}. Mở khóa học để bắt đầu.`
  if(subject==='Class cancelled'&&(match=message.match(/^The class '(.+)' of '(.+)' was cancelled\.(.*)$/)))return `Lớp “${match[1]}” của khóa “${match[2]}” đã bị hủy.${match[3] ? ` Lý do: ${match[3].trim()}` : ''} Kiểm tra lại lịch học với người quản lý.`
  // Free text is retained as authored. No resource link is inferred from subject/message.
  return message
}
