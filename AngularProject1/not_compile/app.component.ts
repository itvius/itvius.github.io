import {Component, OnInit, Inject} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';

export interface DialogData {
    url: string;
    comment: string;
    id: string;
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {
    status;
    imagesMass: any = [];
    idMass = 0;

    constructor(public dialog: MatDialog) {}

    dataForm = new FormGroup ({
        url: new FormControl('', [Validators.required]),
        comment: new FormControl('', [Validators.required])
    });

    ngOnInit() {
        if (localStorage.getItem('massImg') !== null) {
            this.imagesMass = JSON.parse(localStorage.getItem('massImg'));
            if (JSON.parse(localStorage.getItem('massImg')) === null) {
                this.idMass = 0;
            } else {
                this.idMass = this.imagesMass.length;
            }
        }
    }

    openDialog(id, comment, url): void {
        const dialogRef = this.dialog.open(DialogOverviewExampleDialog, {
            width: '900px',
            data: {id: id, comment: comment, url: url}
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result !== undefined) {
                for (let i = 0; i < this.imagesMass.length; i++) {
                    if (this.imagesMass[i].id === id) {
                        this.imagesMass[i].comment = result.comment;
                        this.imagesMass[i].url = result.url;
                        localStorage.setItem('massImg', JSON.stringify(this.imagesMass));
                    }
                }
            }
        });
    }

    addImg() {
        if (this.dataForm.controls['url'].value !== '') {
            this.imagesMass.push(
                {id: this.idMass++ , url: this.dataForm.controls['url'].value, comment: this.dataForm.controls['comment'].value}
            );
            localStorage.setItem('massImg', JSON.stringify(this.imagesMass));
        }
    }
    clearStorage() {
        localStorage.clear();
        this.imagesMass = [];
        this.idMass = 0;
    }

    delete(id) {
        for (const key in this.imagesMass) {
            if (this.imagesMass[key].id === id) {
                this.imagesMass.splice(this.imagesMass.indexOf(this.imagesMass[key]), 1);
                localStorage.setItem('massImg', JSON.stringify(this.imagesMass));
            }
        }
    }

    toggle() {
        this.status = !this.status;
    }
}

@Component({
    selector: 'app-root-dialog',
    templateUrl: 'dialog-overview-example-dialog.html',
})
export class DialogOverviewExampleDialog {

    constructor(
        public dialogRef: MatDialogRef<DialogOverviewExampleDialog>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

    saveChange() {
        this.dialogRef.close(this.data);
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

}
