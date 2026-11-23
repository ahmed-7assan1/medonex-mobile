export type LectureFileCategory='PDF'|'Word'|'Excel'|'Slides'|'Image'|'Archive'|'Other';
export function lectureFileType(name:string,mimeType='') {
  const ext=(name.split('.').pop()||'').toLowerCase().split('?')[0].split('#')[0],mt=mimeType.toLowerCase();
  let category:LectureFileCategory='Other',rgb='139,92,246',label=ext?ext.toUpperCase():(mimeType.split('/')[1]?.toUpperCase().slice(0,8)||'FILE');
  if(ext==='pdf'||mt.includes('pdf')){category='PDF';rgb='244,63,94';label='PDF'}
  else if(['doc','docx'].includes(ext)||mt.includes('word')){category='Word';rgb='59,130,246';label=ext?ext.toUpperCase():'DOC'}
  else if(['xls','xlsx','csv'].includes(ext)||mt.includes('sheet')||mt.includes('excel')){category='Excel';rgb='16,185,129'}
  else if(['ppt','pptx','pps','ppsx'].includes(ext)||mt.includes('presentation')||mt.includes('powerpoint')){category='Slides';rgb='249,115,22'}
  else if(mt.includes('image')||['png','jpg','jpeg','gif','webp','svg','bmp','heic'].includes(ext)){category='Image';rgb='14,165,233';label=ext?ext.toUpperCase():'IMAGE'}
  else if(['zip','rar','7z','tar','gz','gzip'].includes(ext)){category='Archive';rgb='245,158,11'}
  return {category,label,color:`rgb(${rgb})`,tint:`rgba(${rgb},0.1)`,ring:`rgba(${rgb},0.2)`,line:`rgba(${rgb},0.21)`};
}
