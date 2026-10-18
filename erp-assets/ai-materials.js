const form=document.getElementById('ai-materials-form');
if(form){
 for(const group of form.querySelectorAll('[data-ai-group]')){
  const toggle=group.querySelector('[data-ai-toggle]'),materials=[...group.querySelectorAll('[data-ai-material]')];
  const update=()=>{for(const item of materials)item.disabled=!toggle.checked;};
  toggle.addEventListener('change',()=>{if(group.dataset.aiGroup!=='photos')for(const item of materials)item.checked=toggle.checked;update();});update();
 }
 form.addEventListener('submit',event=>{
  const count=name=>form.querySelectorAll(`input[name="${name}"]:checked:not(:disabled)`).length;
  const photos=count('ai_photo_ids[]'),pdfs=count('ai_pdf_ids[]'),usingPhotos=form.querySelector('[name="ai_use_photos"]').checked;
  if(pdfs>6||photos>10||usingPhotos&&!photos){event.preventDefault();alert(pdfs>6?'Выберите не больше 6 PDF.':photos>10?'Выберите не больше 10 фотографий.':'Отметьте фотографии для анализа.');}
 });
}
