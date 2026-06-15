/**
 * 共通Firestoreヘルパー
 * 各ページからimportして使う
 */
import { db } from './firebase-config.js';
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

const uid = () => localStorage.getItem('iriam_uid');

/**
 * ユーザードキュメントを読み込む
 * @param {string} path - 'gacha/default' など
 */
export async function dbLoad(path) {
    if (!uid()) return null;
    try {
        const ref = doc(db, 'users', uid(), path);
        const snap = await getDoc(ref);
        return snap.exists() ? snap.data() : null;
    } catch(e) {
        console.warn(`dbLoad(${path}) 失敗:`, e);
        return null;
    }
}

/**
 * ユーザードキュメントを保存する
 * @param {string} path - 'gacha/default' など
 * @param {object} data
 */
export async function dbSave(path, data) {
    if (!uid()) return;
    try {
        const ref = doc(db, 'users', uid(), path);
        await setDoc(ref, { ...data, updatedAt: serverTimestamp() });
    } catch(e) {
        console.warn(`dbSave(${path}) 失敗:`, e);
    }
}
