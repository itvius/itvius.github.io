import {Component, OnInit, ViewChild} from '@angular/core';
import {ButtonsService, TitleService} from '../cloud.service';
import {ErrorsService} from '../../errors/errors.service';
import {User} from '../../user/user';
import {Company} from '../companies/company';
import {MatDialog, MatSort, MatTableDataSource} from '@angular/material';
import {UsersService} from './users.service';
import {TranslateService} from '@ngx-translate/core';
import {PopupComponent} from '../../popup/popup.component';
import {Router} from '@angular/router';
import {CompaniesService} from '../companies/companies.service';

@Component({
    selector: 'app-users',
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.less']
})
export class UsersComponent implements OnInit {

    listUsers: any[];
    Columns: string[] = [
        'active', 'id', 'name', 'patronymic', 'surname', 'phone_number', 'email', 'user_time_zone', 'group_name', 'settings'
    ];
    displayedColumns: string[] = this.Columns;
    settingColumns: number[] = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    dataSource = new MatTableDataSource();
    access_groups;
    company_id;
    access_group_id;
    group_name;
    useSwitch = true;
    public isSpinnerVisible = true;

    @ViewChild(MatSort) sort: MatSort;

    buttons: any[] = [{
        name: 'users.buttons.add',
        icon: 'add_circle',
        id: 'popupAddGroup'
    }];

    title = 'titles.users.list';
    constructor(
        private titleService: TitleService,
        private buttonsService: ButtonsService,
        private usersService: UsersService,
        private companiesService: CompaniesService,
        private translate: TranslateService,
        public dialog: MatDialog,
        private router: Router,
        private errors: ErrorsService
    ) {
        this.renderColumns();
        translate.setDefaultLang('ru');
        translate.use(translate.getBrowserLang());
    }

    ngOnInit() {
       this.companiesService.listUsers().then((users: any) => {
                this.usersService.getAllGroups().then((groups: any) => {
                    this.access_groups = groups.data.access_groups;
                    this.listUsers = users.data.users;
                    this.dataSource.data = this.listUsers;
                    for (let i = 0; i < this.listUsers.length; i++) {
                        if (
                            this.listUsers[i]['tie_default_company'].access_group_id === null
                            && this.listUsers[i]['tie_default_company'].is_admin
                        ) {
                            this.listUsers[i].group_name = 'Администратор';
                        } else if (
                            this.listUsers[i]['tie_default_company'].access_group_id !== null
                            && !this.listUsers[i]['tie_default_company'].is_admin
                        ) {
                            for (const group of this.access_groups) {
                                if (group.id === this.listUsers[i]['tie_default_company'].access_group_id) {
                                    this.listUsers[i].group_name = group.name;
                                }
                            }
                        }
                        this.isSpinnerVisible = false;
                    }
                }, error => {
                    this.errors.showSnackbar(error.error.error.data.msg);
                });
            },
            error => {
                this.errors.showSnackbar(error.error.error.data.msg);
            });
        this.dataSource.sort = this.sort;
    }

    renderColumns() {
        if (localStorage.getItem('usersSettingColumns')) {
            const tmp = [];
            this.settingColumns = JSON.parse(localStorage.getItem('usersSettingColumns'));
            const settingColumns = this.settingColumns;
            this.Columns.forEach(function (element, i) {
                if (settingColumns[i] === 1) {
                    tmp.push(element);
                }
            });
            this.displayedColumns = tmp;
        }
    }

    onChangeSettings(index) {
        const tmp = [];
        if (this.settingColumns[index] === 0) {
            this.settingColumns[index] = 1;
        } else {
            this.settingColumns[index] = 0;
        }
        const settingColumns = this.settingColumns;
        this.Columns.forEach(function (element, i) {
            if (settingColumns[i] === 1) {
                tmp.push(element);
            }
        });
        this.displayedColumns = tmp;
        localStorage.setItem('usersSettingColumns', JSON.stringify(this.settingColumns));
    }

    deleteUser(user_id, index) {
        if (this.listUsers.length === 1) {
            this.errors.showSnackbar(this.translate.instant('users.errors.not_delete_last_user'));
        } else {
            this.usersService.deleteUser(user_id).subscribe((data: any) => {
                this.listUsers = this.listUsers.splice(index - 1, 1);
                this.dataSource.data = this.listUsers;
                this.dataSource.sort = this.sort;
                this.dialog.open(PopupComponent, {
                    width: '400px',
                    data: {name: this.translate.instant('users.errors.delete_success'), message: data.msg}
                });

            }, error => {
                this.errors.showSnackbar(error.error.error.data.msg);
            });
        }
    }

    toggleActive(value, user_id) {
        const body = {
            active: value.checked,
        };
        this.usersService.saveSwitch(body, user_id)
            .then(
                (data: any) => {                   
                }, error => {
                    console.log(error);
                }
            );
    }
}
