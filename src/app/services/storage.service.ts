import { inject, Injectable } from '@angular/core';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class FireStorageService {
  private readonly storage: Storage = inject(Storage);
  constructor() { }

  async uploadFile(file: File, name: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const storageRef = ref(this.storage, name);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => { },
        (error) => reject(error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  }

  async getFileUrl(path: string): Promise<string> {
    const fileRef = ref(this.storage, path);
    const url = await getDownloadURL(fileRef);
    return url;
  }
}