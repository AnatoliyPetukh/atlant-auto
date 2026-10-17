export const STORE_ENDPOINT='https://serwer2454127.home.pl/internal-api/vehicle-drafts.php';
export async function storeRequest(key,{action='',body,query=''}={}) {
  const headers={Authorization:'Bearer '+key};
  if(body && !(body instanceof FormData))headers['Content-Type']='application/json';
  const response=await fetch(STORE_ENDPOINT+(action?'?action='+encodeURIComponent(action):query),{
    method:body?'POST':'GET',headers,body:body instanceof FormData?body:body?JSON.stringify(body):undefined,
    credentials:'omit',redirect:'error',signal:AbortSignal.timeout(90000)
  });
  let result;try{result=await response.json();}catch{throw Error('Хранилище вернуло неизвестный ответ.');}
  if(!response.ok||!result.ok)throw Error(result.error||'Не удалось сохранить черновик.');return result;
}
export async function storeFile(key,id,blob,{name='file',kind='document',sourceUrl=''}={}) {
  if(blob.size<=0||blob.size>20*1024*1024)throw Error('Файл должен быть непустым и не больше 20 МБ.');
  const form=new FormData();form.append('id',id);form.append('kind',kind);form.append('source_url',sourceUrl);form.append('file',blob,name);
  return storeRequest(key,{action:'asset',body:form});
}

export async function storePhotoBlob(key,assetId){
  if(!/^[a-f0-9]{32}$/.test(assetId))throw Error('Некорректный идентификатор фото.');
  const response=await fetch(STORE_ENDPOINT+'?asset='+assetId,{headers:{Authorization:'Bearer '+key},credentials:'omit',redirect:'error',signal:AbortSignal.timeout(30000)});
  if(!response.ok||!/^image\/(jpeg|png|webp)(?:;|$)/.test(response.headers.get('Content-Type')||''))throw Error('Не удалось открыть сохранённое фото.');return response.blob();
}
