import { Injectable, EventEmitter } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private _showCreatePostModal = false;
  private _showCreateReelModal = false;

  // Event emitters to notify subscribers when modal state changes
  showCreatePostModalChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  showCreateReelModalChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  get showCreatePostModal(): boolean {
    return this._showCreatePostModal;
  }

  set showCreatePostModal(value: boolean) {
    this._showCreatePostModal = value;
    this.showCreatePostModalChange.emit(value);
    console.log('ModalService: showCreatePostModal set to', value);
  }

  get showCreateReelModal(): boolean {
    return this._showCreateReelModal;
  }

  set showCreateReelModal(value: boolean) {
    this._showCreateReelModal = value;
    this.showCreateReelModalChange.emit(value);
    console.log('ModalService: showCreateReelModal set to', value);
  }

  openCreatePostModal(): void {
    this.showCreatePostModal = true;
    console.log('ModalService: openCreatePostModal called');
  }

  closeCreatePostModal(): void {
    this.showCreatePostModal = false;
    console.log('ModalService: closeCreatePostModal called');
  }

  openCreateReelModal(): void {
    this.showCreateReelModal = true;
    console.log('ModalService: openCreateReelModal called');
  }

  closeCreateReelModal(): void {
    this.showCreateReelModal = false;
    console.log('ModalService: closeCreateReelModal called');
  }
}
