// 保存形式が不明な場合は上書きしない。保存失敗時は呼び出し元へ例外を返す。
window.BoukenSave=Object.freeze({
 load(){const raw=localStorage.getItem(BoukenSchema.key);if(raw===null)return BoukenSchema.makeInitialSave();let data;try{data=JSON.parse(raw);}catch(e){throw Error('セーブデータが破損しています');}if(!data||data.schemaVersion!==BoukenSchema.version)throw Error('保存形式が一致しません');return BoukenSchema.normalizeSave(data);},
 save(data){if(!data||data.schemaVersion!==BoukenSchema.version)throw Error('保存形式が不正です');const other=Object.keys(localStorage).filter(k=>k.startsWith('bouken.save.')&&k!==BoukenSchema.key);if(other.length)throw Error('別形式のセーブデータが存在します');const old=localStorage.getItem(BoukenSchema.key);if(old!==null){let prior;try{prior=JSON.parse(old)}catch(e){throw Error('既存セーブが破損しています');}if(!prior||prior.schemaVersion!==BoukenSchema.version)throw Error('既存セーブ形式が異なります');}const copy=BoukenSchema.normalizeSave(JSON.parse(JSON.stringify(data)));copy.updatedAt=new Date().toISOString();localStorage.setItem(BoukenSchema.key,JSON.stringify(copy));return copy;},
 exists(){return localStorage.getItem(BoukenSchema.key)!==null;}
});
