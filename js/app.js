var d = d || document;
var w = w || window;

var App = {
        license: {
            level: 3,
            type: 'hosting',
            limitations: {
                'device_user_attributes_amount': 5
            },
            checkFunction: function (key) {
                var self = this;
                return _.has(self.limitations, key) ? self.limitations[key] : false;
            },
            upgradeConfirm: function () {
                var modal = UI.modal.confirm({
                    title: 'Ограничение лицензии'
                });
                modal.getHeader().addClass('bg-info');
                modal.getFooter().css({'text-align': 'center'});
                modal.getContent().html('<div align="center">Ваша лицензия базовая, свяжитесь с вашим дилером для обновления лицензии</div>');
                modal.buttons.addClass('btn-info');
                modal.show();
            }
        },
        env: null,
        environment: {},
        route: null,
        params: [],
        contentManagement: null,
        sessionExpire: (60 * 1000),
        switchLanguage: function (lang) {
            $('body').fadeOut();
            UI.action('json.change-locale', {locale: lang}, function (json) {
                if (json && !json.error) {
                    d.location.reload();
                }
            });
        },
        windowResize: function (e) {
            var wHeight = $(w).height();
            var minHeight = $('.navbar-default').height();
            if (minHeight > wHeight) {
                wHeight = minHeight;
            }
            $('#wrapper').attr('style', 'height:' + (wHeight) + 'px !important');
            $('#page-wrapper').attr('style', 'height:' + wHeight + 'px !important');
            $('.wrapper-content').attr('style', 'height:' + (wHeight - 51) + 'px !important');
            $('.ibox').attr('style', 'height:' + (wHeight - 51) + 'px !important');
        },
        errors: {
            show: function (error) {
                var self = this;
                if (error.code < 0) {
                    App.license.upgradeConfirm();
                    return;
                }
                var message = ((error['global'] && App.env === "production") ? self.errors['production'] : (self.errors.hasOwnProperty(error.code) ? self.errors[error.code] : error.toString()));
                var opts = {
                    title: '<i class="fa fa-fw fa-exclamation-triangle fa-3x text-danger"></i>',
                    text: '<h3 class="text-danger italic">' + message + '</h3>',
                    confirmButtonColor: '#ed5565',
                    html: true,
                    blurHideButtons: [1]
                };
                if (error.logout) {
                    opts.extendFunction = function () {
                        return App.user.logout();
                    };
                }
                UI.modal.swal(opts);
            }
        },
        i18n: {
            find: function (o, key) {
                var self = this;
                var path = key.split('.');
                var val = path.shift();
                if (o.hasOwnProperty(val)) {
                    //console.log(o[val]);
                    if (typeof o[val] === "object") {
                        return self.find(o[val], path.join('.'));
                    }
                    return o[val];
                }
                return null;
            },
            exists: function (key) {
                var self = this;
                return self.find(self, key) ? true : false;
            },
            locale: function (key) {
                var self = this;
                var found = self.find(self, key);
                return found ? found : key.split('.').pop();
            }
        },
        parseUrlParams: function (extend) {
            var self = this;
            var tmp = d.location.href.split('?');
            if (tmp[1]) {
                var vars = tmp[1].split('&');
                var names = [], vals = [];
                _.each(vars, function (v) {
                    var param = v.split('=');
                    names.push(param[0]);
                    vals.push(param[1]);
                });
                self.params = _.object(names, vals);
            } else {
                self.params = null;
            }
        },
        init: function () {
            var self = this;
            // app init;
            // set App env
            //console.log(w.pace);
            UI.afterAction.push(function (xhr) {
                    _.mapObject(xhr.responseJSON, function (v, k) {
                        if (App.hasOwnProperty(k)) {
                            if (App[k] instanceof Object) {
                                _.extend(App[k], v);
                            } else {
                                App[k] = v;
                            }
                        } else {
                            App[k] = v;
                            UI.log('new prop: ' + k);
                        }
                    });
                    // set alert on session expires
                    self.parseUrlParams();
                    self.user.session.onDestroy(App.sessionExpire);
                    self.notifications.init();
                    // set error alert on error json
                    if (xhr.responseJSON && xhr.responseJSON.error) {
                        self.errors.show(xhr.responseJSON.error);
                    }
                    UI.env = App.env;
                }
            );
            $(w).resize(function () {
                self.windowResize();
            });
            self.windowResize();
            $.when(
                UI.action('json.init', {})).then(function () {
                //self.user.offerSwitchLanguage();
                /**/
                moment().locale(App.locale);
                UI.log('set locale: ' + App.locale);
                $.when(
                    $.ajax({
                        url: '/js/nekta/reports.js?rev=' + App.environment.build_revision,
                        dataType: "script",
                        cache: true
                    })
                ).done(function () {
                    //console.log(App);
                    self.contentManagement = UI.contentManagement.create({
                        // props default
                        obj: $('.ibox-content'),
                        backListText: App.i18n.locale('text.back_to_the_list')
                    });
                    /**/
                    App.initRoute(App.route);
                    if (App.afterCreate) {
                        App[App.afterCreate]();
                    }
                    $('a[href="#"], a[href="/#"]').click(function () {
                        $(this).attr('href', 'javascript:void(0);');
                        //return false;
                    });
                    $('.user-logout').click(function () {
                        return App.user.logout();
                    });
                    /**/
                    $('.navbar-minimalize').click(function () {
                        $("body").toggleClass("mini-navbar");
                        var is = $("body").hasClass("mini-navbar") ? 'mini-navbar' : '';
                        UI.cookies.set("collapse_menu", is);
                    });
                });
            });
        },
        companies: {
            service: {
                jqueryNode: null,
                filter: {
                    timestampbegin: 0,
                    timestampend: 0,
                    jqueryNode: null
                },
                render: function () {
                    var self = this;
                    UI.action('json.devices.service', {
                        timestampbegin: self.filter.timestampbegin,
                        timestampend: self.filter.timestampend
                    }, function (json) {
                        if (json.devices.devices_services.length == 0) {
                            self.jqueryNode.html('<span>' + App.i18n.locale('text.no_data') + '</span>');
                        } else {
                            UI.grid.create({
                                fields: ['id', 'title', 'calibration', 'diagnosis', 'replacement'],
                                parsingDates: ['calibration', 'diagnosis', 'replacement'],
                                columns: [
                                    {className: 'hide'},
                                    {title: App.i18n.locale('text.name')},
                                    {title: App.i18n.locale('device_properties.date_calibration_device'), className: 'text-center'},
                                    {title: App.i18n.locale('device_properties.date_diagnosis_device'), className: 'text-center'},
                                    {title: App.i18n.locale('device_properties.date_replacement_device'), className: 'text-center'}
                                ],
                                items: json.devices.devices_services,
                                fnRowCallback: function (nRow, aData, iDisplayIndex) {
                                    // Bind click event
                                    /*
                                     $(nRow).addClass('row-full-data c-pointer');
                                     $(nRow).mouseenter(function () {
                                     $(this).addClass('bg-muted');
                                     }).mouseleave(function () {
                                     $(this).removeClass('bg-muted');
                                     });*/
                                    return nRow;
                                },
                                jqueryNode: self.jqueryNode
                            });
                        }
                    });
                }
            },
            templateHTML: function (company) {
                var self = this;
                var html;
                if (company) {
                    //UI.log(company);
                    html = '<div></div>';
                    html = $(html);
                    var pcParams = {
                        jqueryNode: html,
                        minHeight: '100%',
                        tabNames: [
                            App.i18n.locale('text.general_information')
                        ],
                        tabContents: [
                            (
                                '<div id="companyForm">' +
                                '<input type="hidden" name="companyId" value="' + company.id + '"/>' +
                                '<label class="controls">' + App.i18n.locale('text.caption') + '<input type="text" name="title" class="form-control" readonly="readonly" value="' + UI.replaceStrings(company.title) + '"/></label>' +
                                '<label class="controls">' + App.i18n.locale('text.desc') + '<textarea name="desc" class="form-control">' + String(company.desc ? company.desc : '') + '</textarea></label>' +
                                UI.switch.create({
                                    id: 'storage',
                                    text: App.i18n.locale('text.storage'),
                                    on_off_text: [App.i18n.locale('text.no'), App.i18n.locale('text.yes')],
                                    checked: Boolean(company.storage)
                                }) +
                                '<button class="btn btn-primary btn-company-save"><i class="fa fa-fw fa-save"></i>&#160;' + App.i18n.locale('text.save') + '</button>' +
                                '</div>'
                            )
                        ],
                        tabEvents: [
                            null
                        ]
                    };
                    if (App.user.company_id == company.id) {
                        if (App.user.access.devices.update) {
                            // TAB DATES
                            pcParams.tabNames.push(App.i18n.locale('text.service_devices'));
                            pcParams.tabContents.push((
                                '<div>' +
                                '<div align="center">' + App.i18n.locale('text.request_data') + '</div>' +
                                '</div>'
                            ));
                            pcParams.tabEvents.push(function () {
                                var pc = this;
                                var tabBody = pc.tabActive.content.find('.panel-body');
                                var html = '<div><div class="service-filter">' +
                                    '<div class="input-group">' +
                                    '<input class="service-daterange form-control width-300 text-center"/>' +
                                    '</div></div>' +
                                    '<div id="devices_services_list" align="center">' + App.i18n.locale('text.request_data') + '</div>' +
                                    '</div>';
                                html = $(html);
                                tabBody.html(html);
                                self.service.jqueryNode = html.find('#devices_services_list');
                                html.find('.service-daterange').dateRangePicker({
                                    format: 'DD MMMM YYYY',
                                    startOfWeek: 'monday',
                                    language: App.locale,
                                    separator: ' ' + App.i18n.locale('text.to') + ' ',
                                    container: tabBody.find('.service-daterange').parent()
                                });
                                html.find('.service-daterange').on('datepicker-change, datepicker-apply', function (ev, picker) {
                                    var timestampBegin = parseInt(moment(picker.date1).startOf("day").valueOf() / 1000);
                                    var timestampEnd = parseInt(moment(picker.date2).endOf("day").valueOf() / 1000);
                                    $(this).val(picker.value);
                                    self.service.filter.timestampbegin = timestampBegin;
                                    self.service.filter.timestampend = timestampEnd;
                                    UI.log('show service devices: ' + new Date(timestampBegin * 1000).toLocaleString() + ' - ' + new Date(timestampEnd * 1000).toLocaleString());
                                    html.find('.service-daterange').data('dateRangePicker').close();
                                    self.service.render();
                                });
                                html.find('.service-daterange').data('dateRangePicker').setStart(moment().startOf('month').format('DD MMMM YYYY')).setEnd(moment().endOf('month').format('DD MMMM YYYY'));
                                tabBody.find('.service-daterange').parent().find('.apply-btn').trigger('click');
                            });
                            /*
                             pcParams.tabNames.push(App.i18n.locale('text.testing_data'));
                             pcParams.tabContents.push((
                             '<div>' +
                             '<div align="center">' + App.i18n.locale('text.request_data') + '</div>' +
                             '</div>'
                             ));
                             pcParams.tabEvents.push(function () {
                             var pc = this;
                             var tabBody = pc.tabActive.content.find('.panel-body');
                             UI.grid.create({
                             fields: [{title: 'a'}, {title: 'b'}],
                             items: [[1, 5]],
                             jqueryNode: tabBody
                             });
                             });
                             */
                            // TAB REMOVE TRASH
                            pcParams.tabNames.push(App.i18n.locale('text.basket_removed_devices'));
                            pcParams.tabContents.push((
                                '<div>' +
                                '<div align="center">' + App.i18n.locale('text.request_data') + '</div>' +
                                '</div>'
                            ));
                            pcParams.tabEvents.push(function () {
                                var pc = this;
                                UI.action('json.devices.removed_devices_list', {}, function (json) {
                                    var tabBody = pc.tabActive.content.find('.panel-body');
                                    if (!json || json.devices.removed_list.length == 0) {
                                        tabBody.html('<div align="center">' + App.i18n.locale('text.no_data') + '</div>');
                                    } else {
                                        var html = '<table class="table">' +
                                            '<thead><tr><th>&#160;</th>' +
                                            '<th>' + App.i18n.locale('text.name') + '</th>' +
                                            '<th>&#160;</th></tr>' +
                                            '</thead><tbody>';
                                        _.each(json.devices.removed_list, function (item) {
                                            html += '<tr>' +
                                                '<td>' + item.id + '</td>' +
                                                '<td>' + item.title + '</td>' +
                                                '<td class="width-100">' +
                                                '<div class="btn-group btn-group-sm">' +
                                                '<button class="btn btn-primary btn-restore" data-device-id="' + item.id + '" data-toggle="tooltip" title="' + App.i18n.locale('text.restore_device') + '"><i class="fa fa-fw fa-window-restore"></i></button>' +
                                                '<button class="btn btn-danger btn-total-remove" data-device-id="' + item.id + '" data-toggle="tooltip" title="' + App.i18n.locale('text.remove_total_device') + '"><i class="fa fa-fw fa-remove"></i></button>' +
                                                '</div>' +
                                                '</td>' +
                                                '</tr>';
                                        });
                                        html += '</tbody></table>';
                                        tabBody.html(html);
                                        tabBody.find('.btn-restore').click(function () {
                                            $.when(UI.action('json.devices.restore', {deviceId: $(this).data('device-id')})).then(function () {
                                                $('.tooltip').remove();
                                                pc.tabActive.tab.find('a').trigger('click');
                                            });
                                        });
                                        tabBody.find('.btn-total-remove').click(function () {
                                            $.when(UI.action('json.devices.remove.total', {deviceId: $(this).data('device-id')})).then(function () {
                                                $('.tooltip').remove();
                                                pc.tabActive.tab.find('a').trigger('click');
                                            });
                                        });
                                        App.showTooltip(tabBody);
                                    }
                                });
                            });
                        }
                    }
                    self.pc = UI.pageControl.create(pcParams);
                    html.find('.btn-company-save').click(function () {
                        var form = html.find('#companyForm');
                        var data = UI.json.form(form.find(':input'));
                        UI.action('json.companies.update', data, function () {
                            self.render(self.jqueryNode);
                        });
                    });

                } else {
                    html = '<div id="companyForm">' +
                        '<label class="controls">' + App.i18n.locale('text.caption') + '<input type="text" name="companyName" class="form-control"/></label>' +
                        '<label class="controls">' + App.i18n.locale('text.desc') + '<textarea name="companyDesc" class="form-control"></textarea></label>' +
                        '<hr/>' +
                        '<label class="controls">' + App.i18n.locale('text.email') + '<input type="text" name="userName" class="form-control"/></label>' +
                        '<label class="controls">' + App.i18n.locale('text.pswd') + '<input type="password" name="userPswd" class="form-control"/></label>' +
                        '<div class="checkbox checkbox-success">' +
                        '<input id="acceptRoles" name="acceptRoles" type="checkbox" checked="checked"/>' +
                        '<label for="acceptRoles">' + App.i18n.locale('text.create_basic_groups') + '</label></div>' +
                        UI.switch.create({
                            id: 'storage',
                            text: App.i18n.locale('text.storage'),
                            on_off_text: [App.i18n.locale('text.no'), App.i18n.locale('text.yes')],
                            checked: false
                        }) +
                        '<br/><button class="btn btn-primary btn-company-create"><i class="fa fa-fw fa-save"></i>&#160;' + App.i18n.locale('text.create') + '</button>' +
                        '</div>';
                    html = $(html);
                    html.find('[name=companyName], [name=userName], [name=userPswd]').keyup(function () {
                        $(this).parent().removeClass('has-error');
                    });
                    html.find('.btn-company-create').click(function () {
                        var data = UI.json.form(html.find(':input'));
                        if (data.companyName.length < 5) {
                            html.find('[name=companyName]').focus();
                            html.find('[name=companyName]').parent().addClass('has-error');
                            return;
                        }
                        if (data.userName.length < 5) {
                            html.find('[name=userName]').focus();
                            html.find('[name=userName]').parent().addClass('has-error');
                            return;
                        }
                        if (data.userPswd.length < 5) {
                            html.find('[name=userPswd]').focus();
                            html.find('[name=userPswd]').parent().addClass('has-error');
                            return;
                        }
                        //UI.log(data);
                        //return;
                        UI.action('json.companies.wizard', data, function (json) {
                            if (json && !json.error) {
                                self.render(self.jqueryNode);
                            }
                        });
                    });
                }
                return html;
            },
            render: function (jqueryNode, search) {
                var self = this;
                self.jqueryNode = jqueryNode;
                self.search = search;
                jqueryNode.removeClass('hide');
                $.when(
                    UI.action('json.companies', {
                        search: search || null
                    })
                ).then(function (json) {
                    $('.nekta-help').data('section', 'companies');
                    var html = '';
                    jqueryNode.html(html);
                    html += '<div>';
                    html += '<h2 class="fw-400 p-h-xs">' + App.i18n.locale('entities.companies') + '</h2>';
                    html += '<h4 class="no-bold p-h-xs width-75p text-justify">' + App.i18n.locale('text.companies_subtitle') + '</h4>';
                    html += (App.user.access.companies.create ? '<div class="pull-left"><button class="btn btn-primary btn-companies-new"><i class="fa fa-fw fa-plus"></i>&#160;' + App.i18n.locale('text.add_company') + '</button></div>' : '');
                    html += '<div class="table-list" data-for-entity="companies"><div align="center" class="table-filter pull-right">' + App.i18n.locale('text.export_displayed_data') + '<br/></div><br/><table class="table"></table></div>';
                    html += '</div>';
                    html = $(html);
                    html.appendTo(jqueryNode);

                    jqueryNode.slideDown();

                    html.find('.btn-companies-new').click(function () {
                        var content = self.templateHTML();
                        App.contentManagement.push({
                            backListText: App.i18n.locale('text.back_to_the_list_of_companies'),
                            contexts: {
                                prev: {
                                    context: self,
                                    content: self.jqueryNode,
                                    renderFunctions: self.render,
                                    args: [jqueryNode, search]
                                },
                                new: {
                                    context: self,
                                    content: content,
                                    renderFunctions: null,
                                    args: null
                                }
                            }
                        });
                        /*
                         App.contentManagement.push({
                         prevNode: jqueryNode.find('div:first'),
                         newNode: self.templateHTML(),
                         backListText: App.i18n.locale('text.back_to_the_list_of_companies'),
                         clickToBack: function () {
                         self.render(jqueryNode, search);
                         }
                         });
                         */
                    });

                    var table = html.find('.table');
                    var columns = [], dataset = [];
                    columns.push({className: 'hide'});
                    //columns.push({title: '#', width: '10px'});
                    columns.push({title: App.i18n.locale('text.caption')});
                    columns.push({title: App.i18n.locale('text.company_devices_total'), className: 'text-right width-150'});
                    columns.push({title: '&#160;', className: 'text-right width-100', orderable: false});
                    var t = table.DataTable({
                        language: {
                            search: App.i18n.locale('text.search') + ":"
                        },
                        bAutoWidth: false,
                        data: [],
                        columns: columns,
                        dom: 'fbrtp',
                        buttons: [
                            'pdf', 'excel', 'csv'
                        ],
                        paging: false,
                        createdRow: function (row, data) {
                            $(row).attr('data-key-id', data[0]);
                        },
                        fnRowCallback: function (nRow, aData, iDisplayIndex) {
                            // Bind click event
                            $(nRow).addClass('row-full-data c-pointer');
                            $(nRow).mouseenter(function () {
                                $(this).addClass('bg-white');
                            }).mouseleave(function () {
                                $(this).removeClass('bg-white');
                            });
                            return nRow;
                        }
                    });
                    t.buttons().container().appendTo(html.find('.table-filter'));
                    html.find('.dataTables_filter :input').removeClass('input-sm');
                    html.find('.dataTables_filter :input').off().keyup(function (e) {
                        var i = $(this);
                        var v = i.val();
                        if (v.length > 0 && v.length < 2) {
                            i.focus();
                            return false;
                        }
                        if (e.keyCode === 13) {
                            self.render(jqueryNode, v);
                        }
                    });

                    if (json.companies.companies.length > 0) {
                        _.each(json.companies.companies, function (company, i) {
                            dataset.push([
                                company.id,
                                //(i + 1),
                                company.title,
                                company.devices_count,
                                ('<div class="btn-group btn-group-sm">' +
                                    (App.user.access.companies.access && (App.user.company_id != company.id) ? ('<button class="btn btn-success btn-sign-in" data-user-id="' + company.root_user + '">Войти <i class="fa fa-fw fa-sign-in"></i></button>') : '') +
                                    '</div>')
                            ]);
                        });
                        // update data
                        table.dataTable().fnClearTable();
                        table.dataTable().fnAddData(dataset);
                    }
                    if (json.request.params.search && json.request.params.search.length > 0) {
                        html.find('.dataTables_filter :input').val(json.request.params.search);
                    }
                    //App.setGroupActions(App.user.use_group_actions);

                    // binds buttons
                    html.find('.btn-sign-in').click(function (e) {
                        var btn = $(this);
                        UI.log('login.as');
                        UI.action('json.login.as', {userId: btn.data('user-id')}, function (json) {
                            if (json && json.login === true) {
                                d.location.href = '/';
                            }
                        });
                        e.stopPropagation();
                    });
                    $('.btn-company-remove').click(function () {
                        var btn = $(this);
                        var companyId = btn.data('company-id');
                        UI.modal.swal({
                            title: App.i18n.locale('text.confirm_action'),
                            text: App.i18n.locale('text.remove_company_text'),
                            type: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#DD6B55",
                            confirmButtonText: App.i18n.locale('text.confirm_delete_button_text'),
                            cancelButtonText: App.i18n.locale('text.confirm_cancel_button_text'),
                            closeOnConfirm: false,
                            blurHideButtons: [0]
                        }, function () {
                            UI.action('json.companies.remove', {companyId: companyId}, [self, self.render, jqueryNode]);
                            UI.modal.swal(App.i18n.locale('text.after_confirm_success_text'), App.i18n.locale('text.after_confirm_success_text2'), "success");
                        });
                    });
                    $('.row-full-data').click(function () {
                        var btn = $(this);
                        var companyId = btn.data('key-id');
                        var company = _.findWhere(App.companies.companies, {id: parseInt(companyId)});
                        var content = self.templateHTML(company);
                        App.contentManagement.push({
                            backListText: App.i18n.locale('text.back_to_the_list_of_companies'),
                            contexts: {
                                prev: {
                                    context: self,
                                    content: self.jqueryNode,
                                    renderFunctions: self.render,
                                    args: [jqueryNode, search]
                                },
                                new: {
                                    context: self,
                                    content: content,
                                    renderFunctions: null,
                                    args: null
                                }
                            }
                        });
                        /*
                         App.contentManagement.push({
                         prevNode: jqueryNode.find('div:first'),
                         newNode: content,
                         backListText: App.i18n.locale('text.back_to_the_list_of_companies'),
                         clickToBack: function () {
                         self.render(jqueryNode, search);
                         }
                         });
                         */
                    });
                });
            }
        },
        XXXXXXX: {
            systemVarsTab: function () {
                var self = this;
                var html = '<div><table id="system-vars-table" class="width-100p">';
                _.each(App.administration.system_vars, function (v, i) {
                    html += '<tr>';
                    html += '<td class="width-25p"><input class="form-control no-border text-right" value="' + v.env_name + '"/></td>';
                    html += '<td><input class="form-control no-border" value="' + v.env_value + '"</td>';
                    html += '</tr>';
                });
                html += '</table><button class="pull-right btn btn-primary">add</button></div>';
                return html;
            },
            render: function (jqueryNode) {
                var self = this;
                $.when(
                    UI.action('json.administration')
                ).then(function () {
                    jqueryNode.html('');
                    var html = '<div class="tabs-container">' +
                        '<div class="tabs-left">' +
                        '<ul class="nav nav-tabs">' +
                        // sysvars
                        '<li class="active"><a data-toggle="tab" href="#tab-system-vars">System Vars</a></li>' +
                        // update
                        '<li><a data-toggle="tab" href="#tab-release-update">Release Update</a></li>' +
                        '</ul>' +
                        '<div class="tab-content">' +
                        // sysvars
                        '<div id="tab-system-vars" class="tab-pane active">' +
                        '<div class="panel-body">' + self.systemVarsTab() +
                        '</div></div>' +
                        // update
                        '<div id="tab-release-update" class="tab-pane">' +
                        '<div class="panel-body">' +
                        '<button class="pull-right btn btn-danger btn-release-update">update</button>' +
                        '</div></div>' +
                        // ------
                        '</div>' +
                        '</div>' +
                        '</div>';
                    html = $(html);
                    jqueryNode.html(html);
                    jqueryNode.slideDown();
                    html.find('#system-vars-table :input').focus(function () {
                        var input = $(this);
                        input.addClass('text-bold');
                    }).blur(function () {
                        var input = $(this);
                        input.removeClass('text-bold');
                        if (input[0].defaultValue === input.val()) {
                            return false;
                        }
                        UI.log('change');
                    });
                    html.find('.btn-release-update').click(function () {
                        UI.action('json.administration.release.update');
                    });
                });
            }
        },
        administration: {
            entryPoints: function (entryPoints, jqueryNode) {
                var self = this;
                var html = '<table class="table"><thead><tr><th>Protocol</th><th>Domain</th><th class="text-right width-120"><button class="btn btn-xs btn-primary btn-modal"><i class="fa fa-fw fa-plus"></i></button></th></tr></thead><tbody>';
                _.each(entryPoints, function (point) {
                    html += '<tr>' +
                        '<td>' + point.protocol + '</td>' +
                        '<td>' + point.domain + '</td>' +
                        '<td class="text-right">' +
                        '<div class="btn-group">' +
                        '<button class="btn btn-xs btn-primary btn-modal" data-entry-point-id="' + point.id + '"><i class="fa fa-fw fa-edit"></i></button>' +
                        '<button class="btn btn-xs btn-danger btn-remove" data-entry-point-id="' + point.id + '"><i class="fa fa-fw fa-trash-o"></i></button>' +
                        '</div>' +
                        '</td>' +
                        '</tr>'
                });
                html += '</tbody></table>';
                html = $(html);
                html.find('.btn-modal').click(function () {
                    var btn = $(this);
                    var pointId = parseInt(btn.data('entry-point-id'));
                    var point = null;
                    if (pointId) {
                        point = _.findWhere(App.administration.entry_points, {id: pointId});
                    }
                    var content = '';
                    content += '<label class="controls">Протокол&#160;' + UI.select.create([{
                        id: 'http',
                        title: 'http'
                    }, {id: 'https', title: 'https'}], {
                        selectName: 'protocol',
                        activeItemId: point ? point.protocol : null
                    }) + '</label>';
                    content += '<label class="controls">Домен<input name="url" class="form-control" value="' + (point ? point.domain : '') + '"/></label>';
                    if (point) {
                        content += '<label class="controls">Title App<input name="title" class="form-control" value="' + (point ? point.title : '') + '"/></label>';
                        content += '<label class="controls pull-left">Logo company</label><label class="btn btn-primary pull-left">Upload<input type="file" name="logo-file" class="hide" value="' + (point ? point.logo : '') + '"/></label>' +
                            '<div class="inline-block" style="height:150px;width:150px;margin:0 20px;border:1px dashed gray;"></div>';
                        content += '<label class="controls">Company name<input name="company_title" class="form-control" value="' + (point ? point.company_title : '') + '"/></label>';
                        content += '<label class="controls">css file path<input name="css_file_path" class="form-control" value="' + (point ? point.css_file_path : '') + '"/></label>';
                    }
                    var modal = UI.modal.confirm({
                        title: 'Entry point',
                        content: content,
                        size: 'lg',
                        afterCreate: function () {
                            this.getContent('#protocol').chosen({
                                width: '100px',
                                disable_search_threshold: 10
                            })
                            this.getContent('[name=logo-file]').change(function () {
                                var file = $(this);
                                if (file.val() != '') {

                                }
                            });
                        },
                        onOk: function () {
                            var data = this.getContent(':input');
                            UI.log(UI.json.form(data));
                        },
                        i18nUse: {
                            object: App.i18n,
                            prefix: 'text.'
                        },
                    });
                    modal.show();
                });
                html.appendTo(jqueryNode);
            },
            render: function (jqueryNode) {
                var self = this;
                $.when(
                    UI.action('json.administration')
                ).then(function (json) {
                    jqueryNode.html('');
                    var html = '<div class="tabs-container">' +
                        '<div class="tabs-left">' +
                        '<ul class="nav nav-tabs">' +
                        // sysvars
                        '<li class="active"><a data-toggle="tab" href="#tab-local-vars">local_vars</a></li>' +
                        // update
                        '<li><a data-toggle="tab" href="#tab-entry-points">Enty points</a></li>' +
                        '</ul>' +
                        '<div class="tab-content">' +
                        // sysvars
                        '<div id="tab-local-vars" class="tab-pane active">' +
                        '<div class="panel-body">' +
                        '</div></div>' +
                        // update
                        '<div id="tab-entry-points" class="tab-pane">' +
                        '<div class="panel-body">' +
                        '</div></div>' +
                        // ------
                        '</div>' +
                        '</div>' +
                        '</div>';
                    html = $(html);
                    html.appendTo(jqueryNode);

                    self.entryPoints(json.administration.entry_points, html.find('#tab-entry-points .panel-body'));

                    jqueryNode.slideDown();
                });
            }
        },
        access_roles: {
            data: null,
            showAccess: function (access, isChecked) {
                var checkbox = function (props) {
                    var html = '<div class="checkbox checkbox-success role_policy_checkbox">' +
                        '<input id="' + props.id + '" type="checkbox" ' + (props.checked ? 'checked="checked"' : '') + '/>' +
                        '<label for="' + props.id + '">' +
                        '</label>' +
                        '</div>';
                    return html;
                };
                var html = '<table class="table table-hover">';
                html += '<thead><tr>' +
                    '<th>' + App.i18n.locale('text.name') + '</th>' +
                    '<th class="text-center width-120">' + App.i18n.locale('text.access') + '</th>' +
                    '<th class="text-center width-120">' + App.i18n.locale('text.access_all') + '</th>' +
                    '<th class="text-center width-120">' + App.i18n.locale('text.creating') + '</th>' +
                    '<th class="text-center width-120">' + App.i18n.locale('text.update') + '</th>' +
                    '<th class="text-center width-120">' + App.i18n.locale('text.delete') + '</th>' +
                    '</tr></thead><tbody>';
                //UI.log(access);
                _.each(_.sortBy(access, 'order_by'), function (e) {
                    var entity = _.findWhere(App.entities, {id: e.entity_id});
                    var suffixId = e.company_id + '-' + e.group_id + '-' + e.entity_id;
                    html += '<tr>' +
                        '<td><i class="fa fa-fw ' + entity['fa-icon'] + '"></i>&#160;&#160;' + App.i18n.locale('entities.' + entity.entity) + '</td>' +
                        '<td class="text-center">' + (isChecked ? checkbox({
                            id: 'access-' + suffixId,
                            checked: e.access
                        }) : (e.access ? '<i class="fa fa-check text-info"></i>' : '<i class="fa fa-remove text-danger"></i>')) + '</td>' +
                        '<td class="text-center">' +
                        (entity.access_all_possible ?
                                ((isChecked ? checkbox({
                                    id: 'access_all-' + suffixId,
                                    checked: e.access_all
                                }) : (e.access_all ? '<i class="fa fa-check text-info"></i>' : '<i class="fa fa-remove text-danger"></i>')))
                                :
                                '&#160;'
                        ) + '</td>' +
                        '<td class="text-center">' +
                        (entity.create_possible ?
                                ((isChecked ? checkbox({
                                    id: 'create-' + suffixId,
                                    checked: e.create
                                }) : (e.create ? '<i class="fa fa-check text-info"></i>' : '<i class="fa fa-remove text-danger"></i>')))
                                :
                                '&#160;'
                        ) + '</td>' +
                        '<td class="text-center">' +
                        (entity.update_possible ?
                                ((isChecked ? checkbox({
                                    id: 'update-' + suffixId,
                                    checked: e.update
                                }) : (e.update ? '<i class="fa fa-check text-info"></i>' : '<i class="fa fa-remove text-danger"></i>')))
                                :
                                '&#160;'
                        ) + '</td>' +
                        '<td class="text-center">' +
                        (entity.delete_possible ?
                                ((isChecked ? checkbox({
                                    id: 'delete-' + suffixId,
                                    checked: e.delete
                                }) : (e.delete ? '<i class="fa fa-check text-info"></i>' : '<i class="fa fa-remove text-danger"></i>')))
                                :
                                '&#160;'
                        )
                        + '</td>' +
                        '</tr>';
                });
                html += '</tbody></table>';
                return html;
            },
            selectCompany: function (companies, activeCompanyId) {
                var html = '<select>';
                _.each(companies, function (company) {
                    html += '<option value="' + company.id + '" ' + (company.id == activeCompanyId ? 'selected="selected"' : '') + '>' + company.title + '</option>';
                });
                html += '</select>';
                return html;
            },
            selectGroups: function (groups) {
                var html = '<select id="newAccessGroup">';
                _.each(groups, function (group) {
                    html += '<option value="' + group.id + '">' + App.i18n.locale('text.' + group.title) + '</option>';
                });
                html += '</select>';
                return html;
            },
            render: function (jqueryNode, companyId) {
                var self = this;
                self.jqueryNode = jqueryNode;
                jqueryNode.removeClass('hide');
                $.when(
                    UI.action('json.access_roles')
                ).then(function (json) {
                    $('.nekta-help').data('section', 'access_roles');
                    var html = '';
                    jqueryNode.html(html);
                    html += '<div>';
                    html += '<h2 class="fw-400 p-h-xs">' + App.i18n.locale('entities.access_roles') + '</h2>';
                    html += '<h4 class="no-bold p-h-xs width-75p text-justify">' + App.i18n.locale('text.access_roles_subtitle') + '</h4>';
                    /*
                     //html += '<h2>' + App.i18n.locale('text.current_role_for_group') + ': <b class="font-italic">' + App.i18n.locale('text.' + App.user.group_title) + '</b></h2>';
                     //html += self.showAccess(App.user.access);
                     */
                    var groups = _.filter(json.access_roles.access_groups, function (item) {
                        if (item.id != App.user.access_group_id) {
                            return item;
                        }
                    });
                    if (App.user.access.access_roles.create) {
                        html += '<div class="input-group">' +
                            '<input type="text" id="new_group_name" class="form-control" maxlength="80" placeholder="' + App.i18n.locale('text.input_name_for_new_group') + '" required="required"/>' +
                            '<div class="input-group-btn">' +
                            '<button type="button" class="group_policy_new btn btn-primary">' + App.i18n.locale('text.creating') + '</button>' +
                            '<button type="button" class="btn btn-info dropdown-toggle ' + (groups.length ? '' : 'disabled') + '" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
                            '<span class="caret"></span>' +
                            '<span class="sr-only">Toggle Dropdown</span>' +
                            '</button>' +
                            '<ul class="dropdown-menu pull-right">';
                        _.each(groups, function (group) {
                            html += '<li><a href="#" class="group_policy_new" data-group-template="' + group.id + '">' +
                                App.i18n.locale('text.create_group_on_basic_group') + " [ <b>" + App.i18n.locale('text.' + group.title) + '</b> ]</a></li>';
                        });
                        html += '</ul>' +
                            '</div>' +
                            '</div>' +
                            '<div class="clearfix"></div>' +
                            '<br/>';
                    }
                    html += '<h2>' + App.i18n.locale('text.groups') + '</h2>';
                    html += '<div class="tabs-container">';
                    html += '<div class="tabs-left"><ul class="nav nav-tabs">';
                    _.each(groups, function (group, i) {
                        html += '<li ' + (i === 0 ? 'class="active"' : '') + '>' +
                            '<a data-toggle="tab" href="#access-group-' + group.id + '" aria-expanded="false">' + App.i18n.locale('text.' + group.title) + '</a>' +
                            '</li>';
                    });
                    html += '</ul><div class="tab-content" style="min-height:350px;">';
                    _.each(groups, function (group, i) {
                        var group_access = _.filter(json.access_roles.access_roles, function (a) {
                            if (a.group_id == group.id && a.company_id == json.user.company_id) {
                                return group;
                            }
                        });
                        html += '<div id="access-group-' + group.id + '" class="' + (i === 0 ? 'tab-pane active' : 'tab-pane' ) + '">';
                        html += '<div class="panel-body">' + self.showAccess(group_access, true) +
                            (!group.is_base && App.user.access.access_roles.delete ? '<div class="pull-right"><button class="btn btn-danger group_policy_del" data-group-id="' + group.id + '">' + App.i18n.locale('text.delete') + '</button></div>' : '') +
                            '</div>';
                        html += '</div>';
                    });
                    html += '</div></div>';
                    html += '</div>';
                    html = $(html);
                    html.appendTo(jqueryNode);

                    // binds controls
                    /*
                     html.find('select').chosen({
                     width: '300px',
                     disable_search_threshold: 10
                     }).change(function () {
                     //jqueryNode.slideUp();
                     self.render(jqueryNode, $(this).val());
                     });
                     */
                    // role change
                    html.find('.role_policy_checkbox input').click(function () {
                        var role = [].concat($(this).attr('id').split('-'), [Number($(this).is(':checked'))]);
                        UI.action('json.access_roles.change', {role: role});
                    });
                    // new group
                    html.find('#new_group_name').keyup(function () {
                        $(this).parent().removeClass('has-error');
                    });
                    html.find('.group_policy_new').click(function () {
                        var btn = $(this);
                        var groupName = $('#new_group_name');
                        if (groupName.val().length < 5) {
                            groupName.focus();
                            groupName.parent().addClass('has-error');
                            return false;
                        }
                        UI.action('json.access_roles.new_group', {
                            companyId: companyId,
                            groupName: groupName.val(),
                            groupTemplate: btn.data('group-template')
                        }, [self, self.render, [jqueryNode, companyId]]);
                    });
                    html.find('.group_policy_del').click(function () {
                        var btn = $(this);
                        var move_groups = _.filter(groups, function (group) {
                            return group.id !== btn.data('group-id');
                        });
                        UI.modal.confirm({
                            title: App.i18n.locale('text.confirm_remove_group') + '!',
                            content: '<div align="center">' + App.i18n.locale('text.delete_group_question') + '<br/><br/>' +
                            '<div>' + App.i18n.locale('text.group_move_users_text') + ':' + self.selectGroups(move_groups) + '</div></div>',
                            i18nUse: {
                                object: App.i18n,
                                prefix: 'text.'
                            },
                            afterCreate: function () {
                                this.getContent('select').chosen({
                                    width: '80%',
                                    disable_search_threshold: 10
                                });
                            },
                            onOk: function () {
                                this.hide();
                                UI.action('json.access_roles.del_group', {
                                    removeGroupId: btn.data('group-id'),
                                    migrateToGroupId: this.getContent('#newAccessGroup').val()
                                }, [self, self.render, [jqueryNode, companyId]]);
                            }
                        });
                    });
                    jqueryNode.slideDown();
                });
            }
        },
        users: {
            templateUser: function (userId, companyId, callback) {
                var self = this;
                var user = _.findWhere(App.users.users, {id: parseInt(userId)});
                var groups = companyId ? _.where(App.users.groups, {company_id: parseInt(companyId)}) : App.users.groups;
                if (user) {
                    var pswd_never_change = (user.hasOwnProperty('access') && user.access.hasOwnProperty('extends') && user.access.extends.hasOwnProperty('pswd_never_change')) ? user.access.extends.pswd_never_change : false;
                    var user_never_block = (user.hasOwnProperty('access') && user.access.hasOwnProperty('extends') && user.access.extends.hasOwnProperty('user_never_block')) ? user.access.extends.user_never_block : false;
                    var company = _.findWhere(App.users.companies, {id: parseInt(user.company_id)});
                    var group = _.findWhere(App.users.groups, {
                        company_id: parseInt(user.company_id),
                        id: parseInt(user.access_group_id)
                    });
                    var html = $('<div></div>');
                    var tabs = [App.i18n.locale('text.general_information')],
                        contents = [
                            ('<div>' +
                                '<p class="fw-600">' + App.i18n.locale('text.company') + ': ' + company.title + '</p>' +
                                //'<p class="fw-600">' + App.i18n.locale('text.group') + ': ' + App.i18n.locale('text.' + group.title) + '</p>' +
                                '<label class="controls">' + App.i18n.locale('text.group') + UI.select.create(groups, {
                                    selectName: 'userGroup',
                                    activeItemId: group.id,
                                    i18n: App.i18n
                                }) + '</label>' +
                                '<label class="controls">' + App.i18n.locale('text.fio') + '<input name="userName" class="form-control" value="' + (user.name ? UI.replaceStrings(user.name) : '') + '"/></label>' +
                                '<label class="controls">' + App.i18n.locale('text.email') + '<input name="email" type="email" ' + (userId ? 'readonly="readonly"' : '' ) + ' class="form-control" value="' + (userId ? user.email : '') + '" required="required"/></label>' +
                                '<label id="labelUserToken" class="controls">' + App.i18n.locale('text.token') + '<input class="form-control" name="userToken" readonly="readonly" value="' + user.user_token + '"></label>' +
                                (App.user.access.users.update ? ('<button class="btn btn-primary btn-gi-save" data-user-id="' + user.id + '"><i class="fa fa-fw fa-save"></i>&#160;' + App.i18n.locale('text.save') + '</button>') : '') +
                                (App.user.access.users.delete && App.user.id != user.id ? ('<button class="btn btn-outline btn-danger m-l-md btn-remove" data-user-id="' + user.id + '"><i class="fa fa-fw fa-remove"></i>&#160;' + App.i18n.locale('text.remove') + '</button>') : '') +
                                (App.user.access.users.update ?
                                    (
                                        '<div class="btn-group pull-right">' +
                                        //'<button class="btn btn-info btn-outline btn-personal-rules" data-user-id="' + user.id + '"><i class="fa fa-fw"></i>permission</button>' +
                                        (user_never_block ? '' :
                                            ((App.user.id != user.id) ? ('<button class="btn btn-info btn-outline btn-blocked" data-user-id="' + user.id + '" data-enabled="' + user.enabled + '"><i class="fa fa-fw ' +
                                                (user.enabled ? 'fa-lock' : 'fa-unlock') + '"></i></button>')
                                                :
                                                '')) +
                                        (!pswd_never_change ? '<button class="btn btn-info btn-outline btn-pswd-update" data-user-id="' + user.id + '"><i class="fa fa-fw fa-key"></i></button>' : '') +
                                        '</div>'
                                    )
                                    :
                                    '') +
                                '</div>')
                        ],
                        events = [];
                    events.push(function (e, activeTab) {
                        var content = activeTab.content;
                        content.find('select[id=userCompany]').chosen({width: '100%', disable_search_threshold: 10});
                        content.find('select[id=userGroup]').chosen({width: '100%', disable_search_threshold: 10});
                        content.find('.btn-gi-save').click(function () {
                            var btn = $(this);
                            var userId = btn.data('user-id');
                            var newGroupId = parseInt(content.find('select[name=userGroup]').val());
                            UI.action('json.users.edit', {
                                action: 'update',
                                userId: userId,
                                userName: content.find(':input[name=userName]').val(),
                                userGroup: newGroupId
                            }, callback);
                        });
                        content.find('.btn-remove').click(function () {
                            var btn = $(this);
                            self.remove(btn.data('user-id'), callback);
                        });
                        content.find('.btn-blocked').click(function () {
                            var btn = $(this);
                            var is = btn.data('enabled');
                            self.setBanned(btn.data('user-id'), is);
                        });
                        // binds controls
                        content.find('.btn-personal-rules').click(function () {
                            var btn = $(this);
                            var user = _.findWhere(App.users.users, {id: parseInt(btn.data('user-id'))});
                            var group = _.findWhere(App.users.groups, {id: user.access_group_id});
                            var checkbox = function (props) {
                                var html = '<div class="checkbox checkbox-success permission_checkbox">' +
                                    '<input id="' + props.name + '" type="checkbox" ' + (props.checked ? 'checked="checked"' : '') + ' ' + (props.id ? ('data-permission-id="' + props.id + '"') : '') + '/>' +
                                    '<label for="' + props.name + '">' +
                                    '</label>' +
                                    '</div>';
                                return html;
                            };
                            var content = App.i18n.locale('text.user') + ': <b>' + (user.name ? user.name : user.email) + '</b>';
                            content += ', ' + App.i18n.locale('text.group') + ': <b>' + App.i18n.locale('text.' + group.title) + '</b>';
                            content += App.access_roles.showAccess(user.access.roles, false);
                            content += '<table class="table"><thead><tr><th>' + App.i18n.locale('text.additional_flags') + '</th><th>&#160;</th></tr></thead><tbody>';
                            _.each(user.access.extends, function (v, n) {
                                var extend = _.findWhere(App.extends, {name: n});
                                content += '<tr><td><i class="fa fa-fw ' + extend['fa-icon'] + '"></i>&#160;&#160;' + App.i18n.locale('text.' + n) + '</td><td class="width-120 text-center">' + checkbox({
                                    checked: v,
                                    id: extend.id,
                                    name: n
                                }) + '</td></tr>';
                            });
                            content += '</tbody></table>';
                            var modal = UI.modal.alert({
                                title: App.i18n.locale('text.personal_rules'),
                                content: content,
                                size: 'lg',
                                i18nUse: {
                                    object: App.i18n,
                                    prefix: 'text.'
                                },
                                afterCreate: function () {
                                    this.getContent('.permission_checkbox :input').click(function () {
                                        var is = $(this).is(':checked') ? 1 : 0;
                                        var id = $(this).data('permission-id');
                                        UI.action('json.users.extends.set', {
                                            permission: $(this).attr('id'),
                                            user_id: user.id,
                                            id: id,
                                            value: is
                                        });
                                    });
                                }
                            });
                            modal.show();
                        });
                        content.find('.btn-pswd-update').click(function () {
                            var btn = $(this);
                            var userId = btn.data('user-id');
                            var user = _.findWhere(App.users.users, {id: parseInt(userId)});
                            var modal = UI.modal.confirm({
                                title: 'Сменить пароль для пользователя: ' + user.email,
                                content: '<label class="controls">Новый пароль:<input class="form-control" type="password" name="new-pswd"/></label>' +
                                '<label class="controls">Подтверждение:<input class="form-control ignore" type="password" name="repeat-pswd"/></label>',
                                size: 'lg',
                                i18nUse: {
                                    object: App.i18n,
                                    prefix: 'text.'
                                },
                                onOk: function () {
                                    var np = this.getContent('[name=new-pswd]');
                                    var rp = this.getContent('[name=repeat-pswd]')
                                    if (np.val() !== rp.val()) {
                                        np.focus();
                                    } else {
                                        UI.action('json.users.pswd.update', {
                                            userId: userId,
                                            'np': np.val()
                                        });
                                        modal.hide();
                                    }
                                }
                            });
                            modal.show();
                        });
                    });
                    if (App.user.access.devices.access) {
                        tabs.push(App.i18n.locale('text.tie_devices'));
                        contents.push('<div align="center">' + App.i18n.locale('text.download_devices_list') + '</div>');
                        events.push(function (e, activeTab) {
                            var pc = this;
                            var tabBody = activeTab.content;
                            pc.loadingShow();
                            UI.action('json.users.devices.ties', null, function (json) {
                                var list = _.map(json.devices.list, function (item) {
                                    if ($.inArray(item.id, user.ties_devices) > -1) {
                                        item.selected = true;
                                    }
                                    return item;
                                });
                                var html = $('<div>' + UI.select.create(list, {
                                        selectName: 'devicesTies',
                                        multiple: true,
                                        checkSelected: true
                                    }) +
                                    '<br/><button class="pull-right btn btn-primary btn-devices-save"><i class="fa fa-fw fa-save"></i>&#160;' + App.i18n.locale('text.save') + '</button>' +
                                    '</div>');
                                tabBody.find('.panel-body').html(html);
                                html.find('.btn-devices-save').click(function () {
                                    var btn = $(this);
                                    var icon = btn.find('i');
                                    if (btn.hasClass('disabled')) {
                                        return;
                                    }
                                    btn.addClass('disabled');
                                    var selected = tabBody.find('[name=devicesTies]').val();
                                    var data = {
                                        ties: selected.join(","),
                                        userId: user.id,
                                        state: App.devices.state
                                    };
                                    icon.switchClass('fa-save', 'fa-refresh fa-spin');
                                    UI.action('json.users.devices.ties', data, function (json) {
                                        icon.switchClass('fa-refrash fa-spin', 'fa-save');
                                        btn.removeClass('disabled');
                                        if (json && json.devices.result) {
                                            user.ties_devices = _.map(selected, Number);
                                            App.devices.state = json.devices.state;
                                        } else {
                                            activeTab.tab.click();
                                        }
                                    });
                                });
                                html.find('[name=devicesTies]').bootstrapDualListbox({
                                    nonSelectedListLabel: 'Доступные для привязки',
                                    selectedListLabel: 'Привязанные',
                                    preserveSelectionOnMove: 'moved',
                                    moveOnSelect: false,
                                    filterPlaceHolder: 'Фильтр',
                                    selectorMinimalHeight: 300,
                                    infoText: false,
                                    infoTextEmpty: 'Ничего не выбрано'
                                });
                                pc.loadingHide();
                            });
                        });
                    }
                    if (App.user.access.structures.access) {
                        tabs.push(App.i18n.locale('text.tie_structures'));
                        contents.push('<div align="center">' + App.i18n.locale('text.download_structures') + '</div>');
                        events.push(function (e, activeTab) {
                            var pc = this;
                            pc.loadingShow();
                            UI.action('json.users.structures.ties', null, function (json) {
                                var html = (
                                    '<div><h3 class="no-margins inline-block bold fs-20">' + App.user.company_title + '</h3>' +
                                    '<div id="structures-jstree"></div>' +
                                    '<button class="pull-right btn btn-primary btn-structures-save"><i class="fa fa-fw fa-save"></i>&#160' + App.i18n.locale('text.save') + '</button>' +
                                    '</div>'
                                );
                                html = $(html);
                                activeTab.content.find('.panel-body').html(html);
                                html.find('.btn-structures-save').click(function () {
                                    var btn = $(this);
                                    var icon = btn.find('i');
                                    if (btn.hasClass('disabled')) {
                                        return;
                                    }
                                    btn.addClass('disabled');
                                    var selected = html.find('#structures-jstree').jstree("get_selected");
                                    var data = {
                                        ties: selected.join(","),
                                        userId: user.id,
                                        state: App.structures.state
                                    };
                                    icon.switchClass('fa-save', 'fa-refresh fa-spin');
                                    UI.action('json.users.structures.ties', data, function (json) {
                                        icon.switchClass('fa-refrash fa-spin', 'fa-save');
                                        btn.removeClass('disabled');
                                        if (json && json.structures.result) {
                                            user.ties_structures = _.map(selected, Number);
                                            App.structures.state = json.structures.state;
                                        } else {
                                            activeTab.tab.click();
                                        }
                                    });

                                });
                                var flat = App.structures.prepareData(json.structures.list, json.structures.all_tags);
                                var data = _.map(flat, function (item) {
                                    if ($.inArray(parseInt(item.id), user.ties_structures) > -1) {
                                        if (item.state) {
                                            item.state.push({checked: true, opened: true});
                                        } else {
                                            item.state = {
                                                selected: true,
                                                opened: true
                                            }
                                        }
                                    }
                                    return item;
                                });
                                var jstree = html.find('#structures-jstree').jstree({
                                    core: {
                                        data: data,
                                        check_callback: true,
                                        animation: true,
                                        themes: {
                                            icons: false
                                        }
                                    },
                                    checkbox: {
                                        keep_selected_style: false,
                                        three_state: false,
                                        cascade: 'undetermined'
                                    },
                                    plugins: ["checkbox", "sort"]
                                });
                                jstree.on('loaded.jstree', function () {
                                    jstree.jstree("open_all");
                                });
                                pc.loadingHide();
                            });
                        });
                    }
                    UI.pageControl.create({
                        jqueryNode: html,
                        minHeight: '100%',
                        tabNames: tabs,
                        tabContents: contents,
                        tabEvents: events
                    });
                    return html;
                } else {
                    var html = '<div id="newUserForm">' +
                        '<label class="controls">' + App.i18n.locale('text.company') + ': ' + App.user.company_title +
                        '<input type="hidden" name="newUserCompany" value="' + App.user.company_id + '"/></label>' +
                        '<label class="controls hide">' + App.i18n.locale('text.group') + '<select name="newUserGroup"/></label><hr class="m-t-sm m-b-md"/>' +
                        '<label class="controls">' + App.i18n.locale('text.fio') + '<input name="userName" class="form-control"/></label>' +
                        '<label class="controls">' + App.i18n.locale('text.email') + '<input name="email" class="form-control"/></label>' +
                        '<label class="controls">' + App.i18n.locale('text.pswd') + '<input name="pswd" type="password" class="form-control"/></label>' +
                        '<div class="p-h-md"><div class="radio radio-primary"><input type="radio" id="autoToken" name="autoToken" value="1" checked="checked"/><label for="autoToken">' + App.i18n.locale('text.provide_auto_token') + '</label></div>' +
                        '<div class="radio radio-primary"><input type="radio" id="userToken" name="autoToken" value="0"/><label for="userToken">' + App.i18n.locale('text.use_your_token') + '</label></div>' +
                        '<label id="labelUserToken" class="controls hide">' + App.i18n.locale('text.token') + '<input class="form-control" name="userToken"></label></div>' +
                        '<div class="col-md-6 m-b-md no-padding p-r-md">' + App.i18n.locale('text.tie_devices') + ' [' + App.i18n.locale('text.chosen') + ': <span class="tie-devices-amount">0</span>]<input type="hidden" name="tie-devices"/>&#160;<button class="pull-right btn btn-xs btn-outline btn-info btn-ties" data-ties-for="devices">...</button></div>' +
                        '<div class="col-md-6 m-b-md no-padding">' + App.i18n.locale('text.tie_structures') + ' [' + App.i18n.locale('text.chosen') + ': <span class="tie-structures-amount">0</span>]<input type="hidden" name="tie-structures" value=""/>&#160;<button class="pull-right btn btn-xs btn-outline btn-info btn-ties" data-ties-for="structures">...</button></div>' +
                        (App.user.access.users.create ? ('<button class="btn btn-primary btn-user-create"><i class="fa fa-fw fa-plus"></i>&#160;' + App.i18n.locale('text.create') + '</button>') : '') +
                        '</div>';
                    html = $(html);
                    //html.find('[name=email]').inputmask('email', {placeholder: ''});
                    html.find('.btn-ties').click(function () {
                        var btn = $(this);
                        switch (btn.data('ties-for')) {
                            case 'devices':
                                var modal = UI.modal.confirm({
                                    title: App.i18n.locale('text.tie_devices'),
                                    size: 'lg',
                                    content: '<div align="center">' + App.i18n.locale('text.download_devices_list') + '</div>',
                                    i18nUse: {
                                        object: App.i18n,
                                        prefix: 'text.'
                                    },
                                    onOk: function () {
                                        var selected = modal.getContent('[name=dualListbox]').val();
                                        $('.tie-devices-amount').text(selected.length);
                                        $('input[name=tie-devices]').val(selected.join(","));
                                        modal.hide();
                                    },
                                    afterShow: function () {
                                        modal.__state('loading');
                                        UI.action('json.users.devices.ties', null, function (json) {
                                            var ties = $('input[name=tie-devices]').val().split(',');
                                            var list = _.map(json.devices.list, function (item) {
                                                if ($.inArray(String(item.id), ties) > -1) {
                                                    item.selected = true;
                                                }
                                                return item;
                                            });
                                            var s = '<div>' + UI.select.create(list, {
                                                selectName: 'dualListbox',
                                                multiple: true,
                                                checkSelected: true
                                            }) + '</div>';
                                            modal.setContent($(s));
                                            modal.getContent('[name=dualListbox]').bootstrapDualListbox({
                                                nonSelectedListLabel: 'Доступные для привязки',
                                                selectedListLabel: 'Привязанные',
                                                preserveSelectionOnMove: 'moved',
                                                moveOnSelect: false,
                                                filterPlaceHolder: 'Фильтр',
                                                selectorMinimalHeight: 300,
                                                infoText: false,
                                                infoTextEmpty: 'Ничего не выбрано'
                                            });
                                            modal.__state('free');
                                        });
                                    }
                                });
                                modal.show();
                                break;
                            case 'structures':
                                var modal = UI.modal.confirm({
                                    title: App.i18n.locale('text.tie_structures'),
                                    size: 'lg',
                                    content: '<div align="center">' + App.i18n.locale('text.download_structures') + '</div>',
                                    i18nUse: {
                                        object: App.i18n,
                                        prefix: 'text.'
                                    },
                                    onOk: function () {
                                        var selected = modal.getContent('#structures-jstree').jstree("get_selected");
                                        $('.tie-structures-amount').text(selected.length);
                                        $('input[name=tie-structures]').val(selected.join(","));
                                        modal.hide();
                                    },
                                    afterShow: function () {
                                        modal.__state('loading');
                                        UI.action('json.users.structures.ties', null, function (json) {
                                            var html = $('<div><h3 class="no-margins inline-block bold fs-20">' + App.user.company_title + '</h3><div id="structures-jstree"></div></div>');
                                            modal.setContent(html);
                                            var flat = App.structures.prepareData(json.structures.list, json.structures.all_tags);
                                            var ties = $('input[name=tie-structures]').val().split(',');
                                            //UI.log(ties);
                                            var data = _.map(flat, function (item) {
                                                if ($.inArray(item.id, ties) > -1) {
                                                    if (item.state) {
                                                        item.state.push({checked: true, opened: true});
                                                    } else {
                                                        item.state = {
                                                            selected: true,
                                                            opened: true
                                                        }
                                                    }
                                                }
                                                return item;
                                            });
                                            var jstree = html.find('#structures-jstree').jstree({
                                                core: {
                                                    data: data,
                                                    check_callback: true,
                                                    animation: true,
                                                    themes: {
                                                        icons: false
                                                    }
                                                },
                                                checkbox: {
                                                    keep_selected_style: false,
                                                    three_state: false,
                                                    cascade: 'undetermined'
                                                },
                                                plugins: ["checkbox", "sort"]
                                            });
                                            modal.__state('free');
                                            jstree.on('loaded.jstree', function () {
                                                jstree.jstree("open_all");
                                            })
                                        });
                                    }
                                });
                                modal.show();
                                break;
                            default:
                                UI.log('unknown for modal...');
                        }
                    });
                    /*
                     html.find('[name=newUserCompany]').chosen({
                     width: '100%',
                     disable_search_threshold: 10
                     }).change(function () {
                     var select = $(this);
                     if (select.val() !== 'null') {
                     group_select.parent().removeClass('hide');
                     } else {
                     group_select.parent().addClass('hide');
                     }
                     });
                     */

                    var group_select = html.find('[name=newUserGroup]');
                    //group_select.html('');
                    _.each(_.where(App.users.groups, {company_id: parseInt(App.user.company_id)}), function (o) {
                        group_select.append('<option value="' + o.id + '">' + App.i18n.locale('text.' + o.title) + '</option>');
                    });
                    html.find('[name=newUserGroup]').chosen({
                        width: '100%',
                        disable_search_threshold: 10
                    });
                    group_select.parent().removeClass('hide');
                    //group_select.trigger("chosen:updated");
                    html.find('input[name=autoToken]').change(function () {
                        var btn = $(this);
                        var lut = html.find('#labelUserToken');
                        lut.removeClass('hide');
                        if (parseInt(btn.val())) {
                            lut.hide();
                            btn.blur();
                        } else {
                            lut.show();
                            lut.find('input').focus();
                        }
                    });
                    html.find('[name=userName], [name=email], [name=pswd], [name=userToken]').keyup(function () {
                        $(this).parent().removeClass('has-error');
                    });
                    html.find('.btn-user-create').click(function (e) {
                        var btn = $(this);
                        var form = btn.parents('#newUserForm');
                        var data = UI.json.form(form.find(':input'));
                        //UI.log(data);
                        /*
                         if (!/\d+/.test(data.newUserCompany)) {
                         form.find('[name=newUserCompany]').trigger('chosen:open');
                         e.stopPropagation();
                         return;
                         }*/
                        if (!/\d+/.test(data.newUserGroup)) {
                            form.find('[name=newUserGroup]').trigger('chosen:open');
                            e.stopPropagation();
                            return;
                        }
                        if (data.userName.length < 5) {
                            form.find('[name=userName]').focus();
                            form.find('[name=userName]').parent().addClass('has-error');
                            return;
                        }
                        if (data.email.length < 5) {
                            form.find('[name=email]').focus();
                            form.find('[name=email]').parent().addClass('has-error');
                            return;
                        }
                        if (data.pswd.length < 5) {
                            form.find('[name=pswd]').focus();
                            form.find('[name=pswd]').parent().addClass('has-error');
                            return;
                        }
                        if (/0/.test(data.autoToken) && data.userToken == '') {
                            form.find('[name=userToken]').focus();
                            form.find('[name=userToken]').parent().addClass('has-error');
                            return;
                        }
                        //UI.log(data);
                        //return;
                        UI.action('json.users.create', data, function (json) {
                            if (json && !json.error) {
                                callback[1].apply(callback[0], callback[2]);
                            }
                        });
                    });
                    return html;
                }
                /*
                 //return html;
                 var html2 = '<div>' +
                 '<form id="templateUserForm" onsubmit="return false;">' +
                 '<label id="labelUserGroup" class="controls ' + (!companyId ? 'hide' : '') + '">' + App.i18n.locale('text.group') +
                 (!user ?
                 UI.select.create(groups, {
                 selectName: userId ? 'userGroup' : 'newUserGroup',
                 selectRequired: true,
                 dataFields: ['company_id'],
                 optionChoose: companyId ? false : 'text.choose_group',
                 activeItemId: userId ? user.access_group_id : null
                 })
                 : '<input value="' + App.i18n.locale('text.' + group.title) + '" class="form-control" readonly="readonly"/>'
                 ) + '</label>' +
                 '<label class="controls">' + App.i18n.locale('text.email') + '<input name="email" type="email" ' + (userId ? 'readonly="readonly"' : '' ) + ' class="form-control" value="' + (userId ? user.email : '') + '" required="required"/></label>' +
                 (!userId ? '<label class="controls">' + App.i18n.locale('text.pswd') + '<input name="pswd" type="password" class="form-control" required="required"/></label>' : '') +
                 (!userId ?
                 (
                 '<div><div class="radio radio-primary"><input type="radio" id="autoToken" name="autoToken" value="1" checked="checked"/><label for="autoToken">' + App.i18n.locale('text.provide_auto_token') + '</label></div>' +
                 '<div class="radio radio-primary"><input type="radio" id="userToken" name="autoToken" value="0"/><label for="userToken">' + App.i18n.locale('text.use_your_token') + '</label></div>' +
                 '<label id="labelUserToken" class="controls hide">' + App.i18n.locale('text.token') + '<input class="form-control" name="userToken"></label></div>'
                 )
                 :
                 '<label id="labelUserToken" class="controls">' + App.i18n.locale('text.token') + '<input class="form-control" name="userToken" readonly="readonly" value="' + user.user_token + '"></label>'
                 ) + '</form>' +
                 (user ?
                 (
                 (App.user.access.users.delete ? ('<div class="pull-left"><button class="btn btn-danger btn-remove" data-user-id="' + user.id + '">' + App.i18n.locale('text.remove') + ' ' + App.i18n.locale('text.user') + '</button></div>') : '') +
                 (App.user.access.users.update ? ('<div class="pull-right"><button class="btn btn-primary btn-save" data-user-id="' + user.id + '">' + App.i18n.locale('text.save') + '</button></div>') : '')
                 )
                 : '<button class="btn btn-primary btn-save"><i class="fa fa-fw fa-save"></i>&#160;' + App.i18n.locale('text.save') + '</button>') +
                 '<div class="clearfix"></div></div>';
                 */
                return html;
            },
            actionButtons: function (user) {
                //UI.log(user);
                var html = '<div class="btn-group btn-group-xs">' +
                    '<button type="button" class="btn btn-info dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
                    '<i class="fa fa-fw fa-ellipsis-v"></i>' +
                    '</button>' +
                    '<ul class="dropdown-menu pull-right">' +
                    // if edit user
                    (user.id !== App.user.id && App.user.access.users.update ?
                        (
                            '<li><a href="javascript:void(0);" class="btn-detail" data-user-id="' + user.id + '" data-user-company-id="' + user.company_id + '"><i class="fa fa-fw fa-address-book"></i>&#160;&#160;' + App.i18n.locale('text.change_show_detail') + '</a></li>' +
                            '<li><a href="javascript:void(0);" class="btn-blocked" data-user-id="' + user.id + '"><i class="fa fa-fw fa-user-times"></i>&#160;&#160;' + App.i18n.locale(user.enabled ? 'text.block_user' : 'text.unblock_user') + '</a></li>' +
                            '<li><a href="javascript:void(0);" class="btn-pswd-update" data-user-id="' + user.id + '"><i class="fa fa-fw fa-flash"></i>&#160;&#160;' + App.i18n.locale('text.update_pswd') + '</a></li>' +
                            '<li><a href="javascript:void(0);" class="btn-personal-rules" data-user-id="' + user.id + '"><i class="fa fa-fw fa-server"></i>&#160;&#160;' + App.i18n.locale('text.personal_rules') + '</a></li>' +
                            '<li role="separator" class="divider"></li>'
                        ) :
                        '') +
                    // if delete user
                    (user.id !== App.user.id && App.user.access.users.delete ?
                        (
                            '<li><a href="javascript:void(0);" class="btn-remove" data-user-id="' + user.id + '"><i class="fa fa-fw fa-trash"></i>&#160;&#160;' + App.i18n.locale('text.delete_user') + '</a></li>' +
                            '<li role="separator" class="divider"></li>'
                        ) :
                        '') +
                    // if user !== this.user
                    (user.id !== App.user.id ?
                        (
                            '<li><a href="javascript:void(0);" class="btn-login-from-user" data-user-id="' + user.id + '"><i class="fa fa-fw fa-sign-in"></i>&#160;&#160;' + App.i18n.locale('text.login_as_user') + '</a></li>'
                        ) :
                        '<li><a href="#" class="btn-detail" data-user-id="' + user.id + '" data-user-company-id="' + user.company_id + '"><i class="fa fa-fw fa-address-book"></i>&#160;&#160;' + App.i18n.locale('text.change_show_detail') + '</a></li>') +
                    '</ul>' +
                    '</div>';
                return html;
            },
            setBanned: function (userId, is) {
                var self = this;
                UI.action('json.users.edit', {
                    userId: userId,
                    action: is ? 'blocked' : 'unblocked'
                }, [self, self.render, [self.jqueryNode, self.users.pList, self.users.companyId || 0, self.search]]);
            },
            remove: function (userId, callback) {
                var self = this;
                var ga = /,/.test(userId);
                UI.modal.swal({
                    title: App.i18n.locale('text.confirm_action'),
                    text: ga ? App.i18n.locale('text.remove_users_text') : App.i18n.locale('text.remove_user_text'),
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: App.i18n.locale('text.confirm_delete_button_text'),
                    cancelButtonText: App.i18n.locale('text.confirm_cancel_button_text'),
                    closeOnConfirm: false,
                    blurHideButtons: [0]
                }, function () {
                    UI.action('json.users.remove', {userId: userId}, callback);
                    UI.modal.swal(App.i18n.locale('text.after_confirm_success_text'), App.i18n.locale('text.after_confirm_success_text2'), "success");
                });
            },
            jqueryNode: null,
            pList: 1,
            companyId: 0,
            search: '',
            render: function (jqueryNode, pList, companyId, search) {
                var self = this;
                $.extend(self, {
                    jqueryNode: jqueryNode,
                    pList: pList,
                    companyId: companyId,
                    search: search
                });
                if (!jqueryNode) {
                    UI.log('error!');
                    UI.log(self);
                    return false;
                }
                jqueryNode.removeClass('hide');
                $.when(
                    UI.action('json.users', {
                        pList: pList || 1,
                        companyId: companyId || 0,
                        search: search || null
                    })
                ).then(function (json) {
                    $('.nekta-help').data('section', 'users');
                    var html = '';
                    jqueryNode.html(html);
                    html += '<div>';
                    /*
                     html += '<div class="pull-right">' +
                     (App.user.access.companies.access_all ?
                     UI.select.create(App.users.companies, {
                     selectName: 'filterCompanies',
                     optionAll: App.i18n.locale('text.all_company'),
                     activeItemId: companyId
                     }) : '') +
                     '</div>';
                     */
                    html += '<h2 class="fw-400 p-h-xs">' + App.i18n.locale('entities.users') + '</h2>';
                    html += '<h4 class="no-bold p-h-xs width-75p text-justify">' + App.i18n.locale('text.users_subtitle') + '</h4>';
                    html += (App.user.access.devices.create ? '<div class="pull-left"><button class="btn btn-primary btn-users-new"><i class="fa fa-fw fa-plus"></i>&#160;' + App.i18n.locale('text.add_user') + '</button></div>' : '');
                    html += '<div class="table-list" data-for-entity="users"><div align="center" class="table-filter pull-right">' + App.i18n.locale('text.export_displayed_data') + '<br/></div><br/><table class="table"></table></div>';
                    html += '<div class="pull-right pagination-div"></div><div class="clearfix"></div>';
                    html += '</div>';
                    //html += (App.user.access.devices.create ? self.templateDeviceForm() : '');
                    html = $(html);
                    html.appendTo(jqueryNode);

                    // top company select
                    html.find('#filterCompanies').chosen({
                        width: '500px',
                        disable_search_threshold: 10
                    }).change(function () {
                        self.render(jqueryNode, pList, ($(this).val() > 0 ? $(this).val() : 0), self.search);
                    });
                    // add pagination
                    UI.pagination.create({
                        jqueryNode: html.filter('.pagination-div'),
                        rowsOnList: App.users.rowsOnList,
                        totalRows: App.users.totalRows,
                        activeList: App.users.pList,
                        onclick: function () {
                            var btn = $(this);
                            var ul = btn.parents('ul');
                            if (!btn.parent().hasClass('active')) {
                                ul.find('li').removeClass('active');
                                btn.parent().addClass('active');
                                self.pList = btn.attr('data-list');
                                self.render(jqueryNode, self.pList, companyId, search);
                            }
                        }
                    });

                    var table = html.find('.table');
                    var columns = [], dataset = [];
                    columns.push({sClass: 'hide'});
                    columns.push({title: '&#160;', sWidth: '10px', orderable: false});
                    columns.push({title: App.i18n.locale('text.email')});
                    //columns.push({title: App.i18n.locale('text.company')});
                    columns.push({title: App.i18n.locale('text.group')});
                    var t = table.DataTable({
                        language: {
                            search: App.i18n.locale('text.search') + ":",
                            emptyTable: search ? App.i18n.locale('text.no_search_result') : App.i18n.locale('text.empty_list')
                        },
                        bAutoWidth: false,
                        columns: columns,
                        dom: 'fbrtp',
                        buttons: [
                            'pdf', 'excel', 'csv'
                        ],
                        paging: false,
                        order: [[2, "desc"]],
                        createdRow: function (row, data) {
                            $(row).addClass('h-50');
                            $(row).attr('data-key-id', data[0]);
                        },
                        fnRowCallback: function (nRow, aData, iDisplayIndex) {
                            // Bind click event
                            $(nRow).addClass('row-full-data c-pointer');
                            $(nRow).data('device-id', aData[0]);
                            $(nRow).mouseenter(function () {
                                $(this).addClass('bg-white');
                            }).mouseleave(function () {
                                $(this).removeClass('bg-white');
                            });
                            return nRow;
                        },

                    });
                    t.buttons().container().appendTo(html.find('.table-filter', t.table().container()));
                    html.find('.dataTables_filter :input').removeClass('input-sm');
                    html.find('.dataTables_filter :input').off().keyup(function (e) {
                        var i = $(this);
                        var v = i.val();
                        if (v.length > 0 && v.length < 2) {
                            i.focus();
                            return false;
                        }
                        if (e.keyCode === 13) {
                            self.render(jqueryNode, 1, companyId, v);
                        }
                    });
                    var users = companyId ? _.where(json.users.users, {company_id: parseInt(companyId)}) : App.users.users;
                    if (users.length > 0) {
                        _.each(users, function (user) {
                            var company = _.findWhere(App.users.companies, {id: user.company_id});
                            var group = _.findWhere(App.users.groups, {id: user.access_group_id, company_id: company.id});
                            var isEnabled = user.enabled == 0 ? '<span class="label label-warning">Б</span>' : '&#160;';
                            dataset.push([
                                user.id,
                                isEnabled,
                                user.name ? ('<b>' + user.name + '</b><br/><span class="text-muted">' + user.email + '</span>') : user.email,
                                //company.title,
                                App.i18n.locale('text.' + group.title),
                                //self.actionButtons(user)
                            ]);
                        });
                        // update data
                        table.dataTable().fnClearTable();
                        table.dataTable().fnAddData(dataset);
                        jqueryNode.slideDown();
                    }
                    if (json.request.params.search && json.request.params.search.length > 0) {
                        UI.log(json.request.params.search);
                        html.find('.dataTables_filter :input').val(json.request.params.search);
                    }
                    App.setGroupActions(App.user.use_group_actions);

                    html.find('.btn-users-new').click(function () {
                        var content = self.templateUser(null, companyId, [self, self.render, [jqueryNode, pList, companyId, search]]);
                        App.contentManagement.push({
                            backListText: App.i18n.locale('text.back_to_the_list_of_users'),
                            contexts: {
                                prev: {
                                    context: self,
                                    content: self.jqueryNode,
                                    renderFunctions: self.render,
                                    args: [jqueryNode, pList, companyId, search]
                                },
                                new: {
                                    context: self,
                                    content: content,
                                    renderFunctions: null,
                                    args: null
                                }
                            }
                        });
                        /*
                         App.contentManagement.push({
                         prevNode: jqueryNode.find('div:first'),
                         newNode: content,
                         backListText: App.i18n.locale('text.back_to_the_list_of_users'),
                         clickToBack: function () {
                         self.render(jqueryNode, pList, companyId, search);
                         }
                         });
                         */
                    });
                    //
                    jqueryNode.find('.row-full-data').click(function () {
                        var btn = $(this);
                        var u = _.findWhere(App.users.users, {id: parseInt(btn.data('key-id'))});
                        var content = self.templateUser(u.id, u.company_id, [self, self.render, [jqueryNode, pList, companyId, search]]);
                        App.contentManagement.push({
                            backListText: App.i18n.locale('text.back_to_the_list_of_users'),
                            contexts: {
                                prev: {
                                    context: self,
                                    content: self.jqueryNode,
                                    renderFunctions: self.render,
                                    args: [jqueryNode, pList, companyId, search]
                                },
                                new: {
                                    context: self,
                                    content: content,
                                    renderFunctions: null,
                                    args: null
                                }
                            }
                        });
                        /*
                         App.contentManagement.push({
                         prevNode: jqueryNode.find('div:first'),
                         newNode: content,
                         backListText: App.i18n.locale('text.back_to_the_list_of_users'),
                         clickToBack: function () {
                         self.render(jqueryNode, pList, companyId, search);
                         }
                         });
                         */
                    });
                    jqueryNode.find('.btn-remove').click(function () {
                        var btn = $(this);
                        self.remove(btn.data('user-id'));
                    });
                    jqueryNode.find('.btn-login-from-user').click(function () {
                        var btn = $(this);

                    });
                });
            }
        },
        structures: {
            stateData: null,
            jstree: null,
            selectedNode: null,
            pageControl: null,
            jqueryNode: null,
            prepareData: function (structures, tags) {
                var self = this;
                var data = [];
                var flat = [];
                var recur = function (rootID) {
                    var nodes = _.where(structures, {parent_id: rootID});
                    _.each(nodes, function (node) {
                        var tag = _.findWhere(tags, {id: node.tag_id});
                        if (tag) {
                            var structure = {
                                id: String(node.id),
                                parent: !rootID ? '#' : String(rootID),
                                data: {
                                    id: tag.id,
                                    title: String(tag.title),
                                    count_devices: node.count_devices,
                                    count_users: node.count_users
                                }
                            };
                            flat.push($.extend({}, structure));
                            structure.text = String(tag.title);
                            /*
                             if (structure.parent === "#") {
                             structure.state = {};
                             structure.state.opened = true;
                             }
                             */
                            data.push(structure);
                        }
                        recur(node.id);
                    });
                    return data;
                };
                recur(null);
                self.stateData = flat;
                return data;
            },
            reparseData: function (jsonTree) {
                var data = [];
                if (jsonTree.length > 0) {
                    _.each(jsonTree, function (el) {
                        data.push({id: el.id, parent: el.parent, data: el.data});
                    });
                }
                return data;
            },
            tree_control_btns: function () {
                //var self = this;
                var html = '<div class="btn-group pull-left">' +
                    '<button class="btn btn-info btn-ec-all" jstree-state="collapse" data-toggle="tooltip" data-placement="top" title="' + App.i18n.locale('tooltips.expand_collapse') + '"><i class="fa fa-fw fa-expand"></i></button>' +
                    '</div><div class="pull-left">&#160;&#160;&#160;</div><div class="input-group pull-left width-40p">' +
                    '<input name="jstree-search" class="form-control" placeholder="' + App.i18n.locale('text.search_in_tree') + '"/>' +
                    '<span class="input-group-btn"><button class="btn btn-primary" type="button" data-toggle="tooltip" data-placement="top" title="' + App.i18n.locale('tooltips.find_in_tree') + '"><i class="fa fa-fw fa-search"></i></button></span>' +
                    '</div><div class="clearfix"></div>';
                return html;
            },
            drawCounters: function () {
                var self = this;
                var structures = self.jstree.jstree(true).get_json('#', {flat: true});
                //UI.log(structures);
                _.each(structures, function (item) {
                    self.jstree.find('#' + item.a_attr.id).find('span').remove();
                    //UI.log(item.data);
                    if (item.data.count_devices) {
                        self.jstree.find('#' + item.a_attr.id).append(' <span data-entity="devices" data-structure-id="' + item.id + '" class="show-entity badge badge-info">' + item.data.count_devices + '</span>');
                    }
                    if (item.data.count_users) {
                        self.jstree.find('#' + item.a_attr.id).append(' <span data-entity="users" data-structure-id="' + item.id + '" class="show-entity badge badge-warning">' + item.data.count_users + '</span>');
                    }
                });
            },
            render: function (jqueryNode, jstreeNode) {
                var self = this;
                self.jqueryNode = self.jqueryNode ? self.jqueryNode : jqueryNode;
                return $.when(UI.action('json.structures')).then(function (json) {
                    //$('.nekta-help').data('section', 'structures');
                    //self.stateBind = false;
                    var html = '<div><div>';
                    html += '<h2 class="fw-400 p-h-xs">' + App.i18n.locale('text.structures_tags') + '</h2>';
                    html += '<h4 class="no-bold p-h-xs width-75p text-justify">' + App.i18n.locale('text.structures_subtitle') + '</h4>';
                    html += '<div class="input-group"><input class="form-control ignore valid" id="new-tag-text" maxlength="100" placeholder="' + App.i18n.locale('text.add_tag') + '" aria-invalid="false"/>' +
                        '<span class="input-group-btn"><button class="btn btn-primary btn-tags-add">' + App.i18n.locale('text.add') + '</button></span></div><br/>';
                    html += self.tree_control_btns();
                    html += '<hr/></div>';
                    html += '<div class="row"><div class="col-md-6"><h3 class="no-margins inline-block fs-20">' + App.user.company_title + '</h3><div id="structures-jstree"></div></div>';
                    html += '<div class="col-md-6 page-control-data"></div></div>';
                    //html += '<hr/><br/><div id="structures-entity-list" class="hide" align="center"><div class="row"><div class="col-md-6 entity-devices"><h3>Устройства</h3></div><div class="col-md-6 entity-users"><h3>Пользователи</h3></div></div></div></div>';
                    html = $(html);
                    var minimalHeight = $('.ibox').height() - 223;
                    UI.log(minimalHeight);
                    var data = self.prepareData(json.structures.structures, json.structures.tags);
                    self.jstree = html.find('#structures-jstree').jstree({
                        core: {
                            data: data,
                            check_callback: true,
                            animation: true,
                            themes: {
                                icons: false
                            }
                        },
                        plugins: ["dnd", "changed", "unique", "search", "sort"]
                    });
                    $(document).bind('dnd_stop.vakata', function () {
                        var newData = self.reparseData(self.jstree.jstree(true).get_json('#', {flat: true}));
                        if (_.isEqual(self.stateData, newData)) {
                            return;
                        }
                        self.drawCounters();
                        UI.action('json.structures.save', {
                            structure: newData
                        }, function () {
                            self.stateData = newData;
                        });
                        UI.log('saved data...');
                    });
                    html.find('[name=jstree-search]').keyup(function () {
                        var ctrl = $(this);
                        var v = ctrl.val();
                        if (v.length > 1) {
                            UI.log(self.jstree.jstree(true).search);
                            self.jstree.jstree(true).search(v);
                        }
                        //html.find('[name=jstree-search]').not(ctrl).val(v);
                    });
                    self.jstree.on('before_open.jstree', function () {
                        //self.drawCounters();
                    });
                    /*html.find('#structures-jstree').on('after_open.jstree', function () {
                     self.drawCounters();
                     });*/
                    var pageControlMaxHeight = minimalHeight - 100;
                    self.jstree.slimScroll({
                        height: (pageControlMaxHeight + 'px'),
                        railOpacity: 0.4,
                        wheelStep: 25
                    });
                    self.jstree.on('select_node.jstree', function (e, selected) {
                        self.selectedNode = selected.node;
                        var btns = html.find('.btns-functions button').removeClass('disabled');
                        var content = $('<label class="controls">' + App.i18n.locale('text.name') + ': <input class="form-control" value="' + selected.node.text + '"/></label>' +
                            '<button class="pull-right btn btn-primary btn-save" data-toggle="tooltip" data-placement="top" title="' + App.i18n.locale('text.rename') + '"><i class="fa fa-fw fa-save"></i></button>' +
                            '<div class="clearfix"></div>' +
                            '<button class="pull-right to-bottom btn btn-outline btn-danger btn-remove" data-remove-id="' + selected.node.id + '" data-toggle="tooltip" data-placement="top" title="' + App.i18n.locale('tooltips.remove_object') + '"><i class="fa fa-fw fa-trash-o"></i>' + App.i18n.locale('text.remove_this_object') + '</button>' +
                            '<div class="pull-left to-bottom btn-group btns-functions">' +
                            '<button class="btn btn-info btn-tie-device" data-structure-id="' + self.selectedNode.id + '" data-toggle="tooltip" data-placement="top" title="' + App.i18n.locale('tooltips.amount_devices') + '"><i class="fa fa-fw fa-microchip"></i>&#160;<span class="badge badge-white">0</span></button>' +
                            '<button class="btn btn-warning btn-tie-users" data-structure-id="' + self.selectedNode.id + '" data-toggle="tooltip" data-placement="top" title="' + App.i18n.locale('tooltips.amount_users') + '"><i class="fa fa-fw fa-users"></i>&#160;<span class="badge badge-white">0</span></button>' +
                            '</div>'
                        );

                        var btn_remove = html.find('.btn-remove');
                        var btn_devices = content.find('.btn-tie-device');
                        var btn_users = content.find('.btn-tie-users');

                        // rename programing...
                        content.find('input').keyup(function (e) {
                            self.jstree.jstree("rename_node", selected.node, $(this).val());
                            if (e.keyCode === 13) {
                                content.filter('button').click();
                            }
                        });
                        content.filter('[data-toggle="tooltip"]').tooltip();
                        content.filter('.btn-save').click(function () {
                            self.drawCounters();
                            UI.action('json.structures.tags.edit', {
                                tagId: self.selectedNode.data.id,
                                structureId: self.selectedNode.id,
                                tagTitle: self.selectedNode.text
                            }, function (json) {
                                //UI.log(json);
                                //UI.log(self.selectedNode.data);
                                self.selectedNode.data.id = json.result.newId;
                                self.selectedNode.data.title = self.selectedNode.text;
                            });
                        });
                        content.filter('.btn-remove').click(function () {
                            var btn = $(this);
                            if (btn.hasClass('disabled')) {
                                return;
                            }
                            var removeId = btn.data('remove-id');
                            UI.modal.swal({
                                title: App.i18n.locale('text.confirm_action'),
                                text: App.i18n.locale('text.remove_tag_text'),
                                type: "warning",
                                showCancelButton: true,
                                confirmButtonColor: "#DD6B55",
                                confirmButtonText: App.i18n.locale('text.confirm_delete_button_text'),
                                cancelButtonText: App.i18n.locale('text.confirm_cancel_button_text'),
                                closeOnConfirm: false,
                                blurHideButtons: [0]
                            }, function () {
                                btn.addClass('disabled');
                                UI.action('json.structures.remove', {
                                    removeId: removeId
                                }, function () {
                                    btn.removeClass('disabled');
                                    self.jstree.jstree(true).delete_node(self.selectedNode);
                                    self.drawCounters();
                                    self.pageControl.obj.remove();
                                    self.pageControl = null;
                                });
                                UI.modal.swal(App.i18n.locale('text.after_confirm_success_text'), App.i18n.locale('text.after_confirm_success_text2'), "success");
                            });
                        });
                        var functionFirstFocus = function (e, tabActive) {
                            setTimeout(function () {
                                tabActive.content.find('input:eq(0)').focus();
                            }, 100);
                        };
                        var lastTabShowed = 0;
                        if (self.pageControl) {
                            lastTabShowed = self.pageControl.tabActive.index;
                        }
                        self.pageControl = UI.pageControl.create({
                            jqueryNode: $('.page-control-data'),
                            icons: ['fa fa-fw fa-microchip', 'fa fa-fw fa-users', 'fa fa-fw fa-address-card'],
                            tabNames: [App.i18n.locale('text.devices'), App.i18n.locale('text.users'), App.i18n.locale('text.object_property')],
                            minHeight: pageControlMaxHeight,//self.jqueryNode.find('.page-control-data').parent().height(),
                            tabContents: ['', '', content],
                            tabEvents: [functionFirstFocus, functionFirstFocus, null]
                        });
                        var pc = self.pageControl;
                        pc.showTab(lastTabShowed);
                        $.when(UI.action('json.structures.show.entity', {
                            companyId: App.user.company_id,
                            entity: 'all',
                            structureId: selected.node.id
                        })).then(function (json) {
                            if (json.structures) {
                                pc.loadingHide();
                                self.selectedNode.data.count_devices = json.structures.devices.length;
                                var tabBody = pc.tabs[0].content.find('.panel-body');
                                if (json.structures.devices.length) {
                                    App.devices.devices = json.structures.devices;
                                    btn_devices.find('.badge').text(App.devices.devices.length);
                                    pc.tabs[2].content.find('.badge').text(self.selectedNode.data.count_devices);
                                    //
                                    var uniq_groups = _.uniq(_.map(App.devices.devices, function (device) {
                                        var type = _.findWhere(App.structures.devices_types, {id: device.device_type_id});
                                        return type.group_id;
                                    }));
                                    //
                                    var s = $('<div class="input-group m-b-sm"><input class="form-control" placeholder="' + App.i18n.locale('text.search_in_devices') + '"/>' +
                                        '<span class="input-group-btn"><button class="btn btn-outline btn-primary"><i class="fa fa-fw fa-close"></i></button></span>' +
                                        '</div>').appendTo(tabBody);
                                    //
                                    var g = $('<div class="m-xs" align="center"><div class="btn-group"></div><button data-toggle="tooltip" data-placement="top" title="' + App.i18n.locale('text.add_device') + '" class="pull-right btn btn-success btn-add-device">+</button></div>').appendTo(tabBody);
                                    _.each(_.sortBy(App.structures.devices_groups, 'order_by'), function (group) {
                                        if (group.id > 0) {
                                            var disabled = '';
                                            if (!($.inArray(group.id, uniq_groups) > -1)) {
                                                disabled = 'disabled';
                                            }
                                            $('<button data-toggle="tooltip" data-placement="top" title="' + App.i18n.locale(group.i18n) + '" class="btn btn-outline btn-default ' + disabled + '" data-group-id="' + group.id + '" ><i class="fa fa-fw ' + group.icon + '"></i></button>').appendTo(g.find('div:first'));
                                        }
                                    });
                                    $('<button data-toggle="tooltip" data-placement="top" title="' + App.i18n.locale('tooltips.show_all') + '" class="btn btn-outline btn-primary active"><i class="fa fa-fw fa-undo"></i></button>').appendTo(g.find('div:first'));
                                    //
                                    var c = $('<div id="device-list" class="p-w-sm"></div>').appendTo(tabBody);
                                    c.slimScroll({
                                        height: (pageControlMaxHeight - 130 + 'px'),
                                        railOpacity: 0.4,
                                        wheelStep: 25
                                    });
                                    /* binds */
                                    g.find('button').click(function () {
                                        var b = $(this);
                                        if (b.hasClass('disabled')) {
                                            return;
                                        }
                                        b.parent().find('button').removeClass('active').switchClass('btn-primary', 'btn-default');
                                        b.switchClass('btn-default', 'btn-primary');
                                        b.addClass('active');
                                        var bs = pc.tabActive.content.find('#device-list div[data-group-id]');
                                        bs.addClass('hide');
                                        bs.filter('[data-group-id=' + b.data('group-id') + ']').removeClass('hide');
                                        if (!b.data('group-id')) {
                                            bs.removeClass('hide');
                                        }
                                        b.blur();
                                    });
                                    s.find(':input').keyup(function () {
                                        var o = $(this);
                                        _.each(pc.tabActive.content.find('#device-list span'), function (btn) {
                                            if (!UI.teststring(new RegExp('.*' + o.val() + '.*', 'gi'), $(btn).text())) {
                                                $(btn).parent().addClass('hide');
                                            } else {
                                                $(btn).parent().removeClass('hide');
                                            }
                                        });
                                    });
                                    s.find('button:eq(0)').click(function () {
                                        pc.tabActive.content.find('div:first input').val('').focus();
                                        pc.tabActive.content.find('div:first button').removeClass('hide');
                                    });
                                    /* ***** */
                                    _.each(json.structures.devices, function (item) {
                                        var type = _.findWhere(App.structures.devices_types, {id: parseInt(item.device_type_id)});
                                        var group = _.findWhere(App.structures.devices_groups, {id: parseInt(type.group_id)});
                                        var title = String(item.title).length > 60 ? (String(item.title).substr(0, 57) + ' ...') : String(item.title);
                                        var active = App.devices.getDeviceStatus(item.last_active);
                                        c.append('<div align="left" class="m-b-xs p-sm" data-group-id="' + type.group_id + '">' +
                                            '<i class="inline-block m-t-xs ' + (active ? 'text-info' : 'text-danger') + ' fa ' + group.icon + ' fa-fw"></i>' +
                                            '<span class="inline-block m-t-xs p-w-sm">' + title + '</span>' +
                                            '<div class="btn-group btn-group-sm pull-right">' +
                                            '<button data-toggle="tooltip" data-placement="top" title="' + App.i18n.locale('tooltips.show_data_device') + '" class="btn btn-info show-report-device" data-device-id="' + item.id + '"><i class="fa fa-line-chart"></i></button>' +
                                            '<button data-toggle="tooltip" data-placement="top" title="' + App.i18n.locale('tooltips.go_to_device') + '" class="btn btn-primary go-to-device" data-device-id="' + item.id + '"><i class="fa fa-dashboard"></i></button>' +
                                            '</div>' +
                                            '</div>');
                                        var a = pc.nt.find('li:eq(0) span');
                                        a.html(pc.tabNames[0] + ' <div class="label label-plain">' + json.structures.devices.length + '</div>');
                                    });
                                } else {
                                    tabBody.append('<div align="center">' + App.i18n.locale('text.empty_list') + '</div>');
                                    tabBody.append('<button data-toggle="tooltip" data-placement="top" title="' + App.i18n.locale('text.add_device') + '" class="pull-right btn btn-success btn-add-device">+</button>');
                                }
                                App.showTooltip(tabBody);
                                self.selectedNode.data.count_users = json.structures.users.length;
                                var tabBody = pc.tabs[1].content.find('.panel-body');
                                if (json.structures.users.length) {
                                    App.users.users = json.structures.users;
                                    btn_users.find('.badge').text(App.users.users.length);
                                    var s = $('<div><div class="input-group m-b-sm"><input class="form-control" placeholder="' + App.i18n.locale('text.search_in_users') + '"/>' +
                                        '<span class="input-group-btn"><button class="btn btn-outline btn-primary"><i class="fa fa-fw fa-close"></i></button></span>' +
                                        '</div>' +
                                        '<button data-toggle="tooltip" data-placement="top" title="' + App.i18n.locale('text.add_user') + '" class="pull-right btn btn-success btn-add-user">+</button>' +
                                        '</div>').appendTo(tabBody);
                                    var c = $('<div class="p-w-sm"></div>').appendTo(tabBody);
                                    c.slimScroll({
                                        height: '390px',
                                        railOpacity: 0.4,
                                        wheelStep: 25
                                    });
                                    /* binds */
                                    s.find(':input').keyup(function (e) {
                                        var o = $(this);
                                        _.each(c.find('button'), function (btn) {
                                            if (!UI.teststring(new RegExp('.*' + o.val() + '.*', 'gi'), $(btn).text())) {
                                                $(btn).addClass('hide');
                                            } else {
                                                $(btn).removeClass('hide');
                                            }
                                        });
                                    });
                                    s.find('button:eq(0)').click(function () {
                                        s.find('input').val('').focus();
                                        c.find('button').removeClass('hide');
                                    });
                                    _.each(json.structures.users, function (item) {
                                        c.append('<button class="btn btn-outline btn-default btn-block m-b-xs show-report-user" data-user-id="' + item.id + '">' + (item.name ? ('<b>' + item.name + '</b><br/>') : '') + item.email + '</button>');
                                        var a = pc.nt.find('li:eq(1) span');
                                        a.html(pc.tabNames[1] + ' <div class="label label-plain">' + json.structures.users.length + '</div>');
                                    });
                                } else {
                                    tabBody.append('<div align="center">' + App.i18n.locale('text.empty_list') + '</div>');
                                    tabBody.append('<button data-toggle="tooltip" data-placement="top" title="' + App.i18n.locale('text.add_user') + '" class="pull-right btn btn-success btn-add-user">+</button>');
                                }
                                App.showTooltip(tabBody);
                                /* *********************** */
                                self.drawCounters();
                                /* *********************** */
                                pc.obj.find('.btn-add-device').click(function () {
                                    $('.tooltip[role=tooltip]').remove();
                                    var content = $('<div>' + App.devices.templateDeviceForm(null) + '</div>');
                                    App.contentManagement.push({
                                        backListText: App.i18n.locale('text.back_to_the_structure_company'),
                                        contexts: {
                                            prev: {
                                                context: self,
                                                content: self.jqueryNode,
                                                renderFunctions: self.render,
                                                args: [self.jqueryNode, self.selectedNode]
                                            },
                                            new: {
                                                context: App.devices,
                                                content: content,
                                                renderFunctions: App.devices.templateDeviceFormBinds,
                                                args: [null, content, {
                                                    tieStructure: self.selectedNode.id
                                                }]
                                            }
                                        }
                                    });
                                });
                                pc.obj.find('.go-to-device').click(function () {
                                    $('.tooltip[role=tooltip]').remove();
                                    var deviceId = $(this).data('device-id');
                                    var content = $('<div>' + App.devices.templateDeviceForm(deviceId) + '</div>');
                                    App.contentManagement.push({
                                        backListText: App.i18n.locale('text.back_to_the_structure_company'),
                                        contexts: {
                                            prev: {
                                                context: self,
                                                content: self.jqueryNode,
                                                renderFunctions: self.render,
                                                args: [self.jqueryNode, self.selectedNode]
                                            },
                                            new: {
                                                context: App.devices,
                                                content: content,
                                                renderFunctions: App.devices.templateDeviceFormBinds,
                                                args: [deviceId, content, {}]
                                            }
                                        }
                                    });
                                });
                                pc.obj.find('.show-report-user').click(function () {
                                    var btn = $(this);
                                    var userId = btn.data('user-id');
                                    var user = _.findWhere(App.users.users, {id: parseInt(userId)});
                                    //UI.log(user);
                                    var content = App.users.templateUser(user.id, user.company_id, [self, self.render, [self.jqueryNode, self.selectedNode]]);
                                    App.contentManagement.push({
                                        backListText: App.i18n.locale('text.back_to_the_structure_company'),
                                        contexts: {
                                            prev: {
                                                context: self,
                                                content: self.jqueryNode,
                                                renderFunctions: self.render,
                                                args: [self.jqueryNode, self.selectedNode]
                                            },
                                            new: {
                                                context: App.users,
                                                content: content,
                                                renderFunctions: null,
                                                args: null
                                            }
                                        }
                                    });
                                });
                                pc.obj.find('.btn-add-user').click(function () {
                                    $('.tooltip[role=tooltip]').remove();
                                    var content = App.users.templateUser(null, null, [self, self.render, [self.jqueryNode, self.selectedNode]]);
                                    App.contentManagement.push({
                                        backListText: App.i18n.locale('text.back_to_the_structure_company'),
                                        contexts: {
                                            prev: {
                                                context: self,
                                                content: self.jqueryNode,
                                                renderFunctions: self.render,
                                                args: [self.jqueryNode, self.selectedNode]
                                            },
                                            new: {
                                                context: App.users,
                                                content: content,
                                                renderFunctions: null,
                                                args: null
                                            }
                                        }
                                    });
                                });
                                pc.obj.find('.show-report-device').click(function () {
                                    var btn = $(this);
                                    var modal = UI.modal.create({
                                        title: 'Просмотр',
                                        titleCloseButton: false,
                                        content: '<div>&#160;</div>',
                                        sizeClassName: 'width-90p',
                                        i18nUse: {
                                            object: App.i18n,
                                            prefix: 'text.'
                                        },
                                        afterCreate: function () {
                                            App.reports_online.init({
                                                modal: this,
                                                deviceId: parseInt(btn.data('device-id')),
                                                jqueryNodeList: this.getContent(''),
                                                showFilter: true
                                            }).draw();
                                        },
                                        beforeShow: function () {
                                            this.getHeader().addClass('bg-info');
                                            this.buttons.removeClass('btn-default').addClass('btn-info');
                                        },
                                        beforeHide: function () {
                                            $('body').find('.date-picker-wrapper').remove();
                                        }
                                    });
                                    modal.show();
                                });
                            }
                        });
                        content.find('.btn-tie-device').click(function () {
                            var btn = $(this);
                            if (btn.hasClass('disabled')) {
                                return;
                            }
                            var structureId = parseInt(btn.data('structure-id'));
                            var structure = _.findWhere(App.structures.structures, {id: structureId});
                            var tag = _.findWhere(App.structures.tags, {id: parseInt(structure.tag_id)});
                            // show modal;
                            //self.createDualList
                            var modal = UI.modal.confirm({
                                title: 'Список привязанных устройств для метки #' + tag.title,
                                content: '<div>&#160;</div>',
                                sizeClassName: 'width-90p',
                                i18nUse: {
                                    object: App.i18n,
                                    prefix: 'text.'
                                },
                                beforeShow: function () {
                                    this.__state('loading');
                                    this.getFooter().addClass('hide');
                                },
                                afterShow: function () {
                                    var modal = this;
                                    $.when(UI.action('json.structures.tie.list', {structureId: structureId})).then(function (json) {
                                        modal.getFooter().hide().removeClass('hide');
                                        modal.getFooter().slideDown();
                                        if (App.structures.devices && App.structures.devices.length) {
                                            App.structures.devices_all = _.map(json.structures.devices_all, function (item) {
                                                if (_.findWhere(App.structures.devices, {id: item.id})) {
                                                    item.selected = true;
                                                }
                                                return item;
                                            });
                                        }
                                        var content = '<div>' + UI.select.create(App.structures.devices_all, {
                                            selectName: 'duallistbox',
                                            //optionFieldTitle: 'title',
                                            multiple: true,
                                            checkSelected: true
                                        }) + '</div>';
                                        modal.setContent(content);
                                        modal.getContent('[name=duallistbox]').bootstrapDualListbox({
                                            nonSelectedListLabel: 'Доступные для привязки',
                                            selectedListLabel: 'Привязанные',
                                            preserveSelectionOnMove: 'moved',
                                            moveOnSelect: false,
                                            filterPlaceHolder: 'Фильтр',
                                            selectorMinimalHeight: 300,
                                            infoText: false,
                                            infoTextEmpty: 'Ничего не выбрано'
                                        });
                                        modal.__state('free');
                                        modal.getContent('select').addClass('overflow-auto');
                                    });
                                },
                                onOk: function () {
                                    var modal = this;
                                    self.tieObjects({
                                        state: App.structures.devices_state,
                                        structureId: structureId,
                                        type: 'devices',
                                        objects: modal.getContent('[name=duallistbox]').val().join(',')
                                    }).done(function (json) {
                                        if (json && !json.error) {
                                            modal.hide();
                                            $('#' + self.selectedNode.a_attr.id).click();
                                        } else {
                                            modal.afterShow();
                                        }
                                    });
                                }
                            });
                            modal.show();
                        });
                        content.find('.btn-tie-users').click(function () {
                            var btn = $(this);
                            if (btn.hasClass('disabled')) {
                                return;
                            }
                            var structureId = parseInt(btn.data('structure-id'));
                            var structure = _.findWhere(App.structures.structures, {id: structureId});
                            var tag = _.findWhere(App.structures.tags, {id: parseInt(structure.tag_id)});
                            // show modal;
                            //self.createDualList
                            var modal = UI.modal.confirm({
                                title: 'Список привязанных пользователей для метки #' + tag.title,
                                content: '<div>&#160;</div>',
                                sizeClassName: 'width-90p',
                                i18nUse: {
                                    object: App.i18n,
                                    prefix: 'text.'
                                },
                                beforeShow: function () {
                                    this.__state('loading');
                                    this.getFooter().addClass('hide');
                                },
                                afterShow: function () {
                                    var modal = this;
                                    $.when(UI.action('json.structures.tie.list', {structureId: structureId})).then(function (json) {
                                        modal.getFooter().hide().removeClass('hide');
                                        modal.getFooter().slideDown();
                                        if (App.structures.users && App.structures.users.length) {
                                            App.structures.users_all = _.map(json.structures.users_all, function (item) {
                                                if (_.findWhere(App.structures.users, {id: item.id})) {
                                                    item.selected = true;
                                                }
                                                return item;
                                            });
                                        }
                                        var content = '<div>' + UI.select.create(App.structures.users_all, {
                                            selectName: 'duallistbox',
                                            optionFieldTitle: 'email',
                                            multiple: true,
                                            checkSelected: true
                                        }) + '</div>';
                                        modal.setContent(content);
                                        modal.getContent('[name=duallistbox]').bootstrapDualListbox({
                                            nonSelectedListLabel: 'Доступные для привязки',
                                            selectedListLabel: 'Привязанные',
                                            preserveSelectionOnMove: 'moved',
                                            moveOnSelect: false,
                                            filterPlaceHolder: 'Фильтр',
                                            selectorMinimalHeight: 300,
                                            infoText: false,
                                            infoTextEmpty: 'Ничего не выбрано'
                                        });
                                        modal.__state('free');
                                        modal.getContent('select').addClass('overflow-auto');
                                    });
                                },
                                onOk: function () {
                                    var modal = this;
                                    self.tieObjects({
                                        state: App.structures.users_state,
                                        structureId: structureId,
                                        type: 'users',
                                        objects: modal.getContent('[name=duallistbox]').val().join(',')
                                    }).done(function (json) {
                                        if (json && !json.error) {
                                            modal.hide();
                                            $('#' + self.selectedNode.a_attr.id).click();
                                        } else {
                                            modal.afterShow();
                                        }
                                    });
                                }
                            });
                            modal.show();
                        });
                    });
                    html.find('.btn-ec-all').click(function () {
                        var btn = $(this);
                        var state = btn.attr('jstree-state');
                        if (state == 'collapse') {
                            self.jstree.jstree("open_all");
                            btn.attr('jstree-state', 'expand');
                            btn.find('i').switchClass('fa-expand', 'fa-compress');
                        }
                        if (state == 'expand') {
                            self.jstree.jstree("close_all");
                            btn.attr('jstree-state', 'collapse');
                            btn.find('i').switchClass('fa-compress', 'fa-expand');
                        }
                        //UI.log(btn.attr('jstree-state'));
                        self.drawCounters();
                    });
                    html.find('#new-tag-text').keyup(function (e) {
                        $(this).parent().removeClass('has-error');
                        if (e.keyCode === 13) {
                            html.find('.btn-tags-add').trigger("click");
                        }
                    });
                    html.find('.btn-tags-add').click(function () {
                        var btn = $(this);
                        if (btn.hasClass('disabled')) {
                            return;
                        }
                        var title = $('#new-tag-text').val();
                        if (title.length < 3) {
                            $('#new-tag-text').focus();
                            $('#new-tag-text').parent().addClass('has-error');
                            return;
                        }
                        btn.addClass('disabled');
                        UI.action('json.structures.tags.add', {tagTitle: title}, function (json) {
                            if (json && json.error) {
                                self.render(self.jqueryNode);
                            } else {
                                btn.removeClass('disabled');
                                self.render(self.jqueryNode);
                            }
                        });
                    });
                    /* **** */
                    jqueryNode.html(html);
                    //UI.log(html.find('.btn-ec-all').attr('jstree-state'));
                    //self.drawCounters();
                    jqueryNode.slideDown({
                        complete: function () {
                            UI.log('complete');
                            setTimeout(function () {
                                html.find('.btn-ec-all').trigger("click");
                                if (jstreeNode) {
                                    self.jstree.jstree("select_node", jstreeNode.id);
                                }
                            }, 100);
                        }
                    });
                });
            },
            tieObjects: function (json) {
                return UI.action('json.structures.tie.objects', json);
            }
        },
        reports_online: {
            props_def: {
                viewAs: 'table',
                viewFields: 'inputs',
                grouping: 1,
                skip: false
            },
            deviceId: null,
            viewAs: 'table',
            viewFields: 'inputs',
            jqueryNodeFilterApply: null,
            jqueryNodeList: null,
            grouping: 1,
            chart: null,
            skip: false,
            init: function (props) {
                var self = this;
                $.extend(self, self.props_def, props ? props : {});
                if (self.showFilter) {
                    self.setFilterHTML();
                }
                return self;
            },
            draw: function () {
                var self = this;
                if (self.jqueryNodeFilterApply) {
                    self.jqueryNodeFilterApply.click();
                }
                return self;
            },
            online: function (props) {
                var self = this;
                if (self.jqueryNodeList.length == 0) {
                    return;
                }
                if (props) {
                    $.extend(self, props ? props : {});
                }
                //UI.log(self);
                var device = _.findWhere(App.devices.devices, {id: self.deviceId});
                var deviceType = _.findWhere(App.devices.device_types, {id: device.device_type_id});
                if (deviceType.calibration_json && !self.skip) {
                    self.jqueryNodeList.find('#report-div').html('<div class="text-center">' + App.i18n.locale('text.request_data') + '</div>');
                }
                if (self.modal) {
                    self.modal.__state('loading');
                } else {
                    self.jqueryNodeList.find('.period-filter .state-loading').removeClass('hide');
                }
                var send = function () {
                    var d = $.Deferred();
                    return self.skip ? d.resolve() : UI.action('json.devices.messages', {
                        deviceId: self.deviceId,
                        timestampBegin: self.jqueryNodeFilterApply.attr('timestampbegin'),
                        timestampEnd: self.jqueryNodeFilterApply.attr('timestampend'),
                        grouping: self.grouping,
                        report_online_settings: device.report_online_settings,
                        calibration_json: device.calibration_json
                    });
                };
                $.when(send()).then(function (json) {
                    if (self.modal) {
                        self.modal.__state('free');
                    } else {
                        self.jqueryNodeList.find('.period-filter .state-loading').addClass('hide');
                    }
                    if (!self.deviceId) {
                        UI.log('Error!');
                        return;
                    }
                    if (!json) {
                        json = App;
                    }
                    var report_online_settings = json.devices.report_online_settings || JSON.parse(device.report_online_settings || deviceType.report_online_settings);
                    var calibration_json = json.devices.calibration_json || JSON.parse(device.calibration_json || deviceType.calibration_json);
                    var html = '';
                    if (json.devices.messages.length == 0) {
                        self.jqueryNodeList.find('#report-div').html('<div class="text-center">' + App.i18n.locale('text.empty_list') + '</div>');
                        return;
                    }
                    if (!calibration_json) {
                        UI.log('wrong... not calibrations for device');
                        return;
                    }
                    if (!report_online_settings) {
                        UI.log('wrong... not report_online_settings for device');
                        return;
                    }
                    //UI.log(self.viewAs);
                    if (self.viewAs == 'table') {
                        self.jqueryNodeList.find('#report-div').html('');
                        var table = self.jqueryNodeList.find('#report-div').find('#datatable-messages');
                        var columns = [],
                            dataset = [],
                            footer = '';
                        /* *** what needs fields? *** */
                        if (report_online_settings.hasOwnProperty('always') && report_online_settings.always.hasOwnProperty('fields')) {
                            _.each(report_online_settings.always.fields, function (field, i) {
                                var label = {};
                                label.title = (App.i18n.exists('reports._' + deviceType.deviceTypeID + '.' + field) ?
                                        App.i18n.locale('reports._' + deviceType.deviceTypeID + '.' + field)
                                        :
                                        App.i18n.locale('reports.' + field)
                                );
                                if (report_online_settings.always.hasOwnProperty('types') && report_online_settings.always.types[i]) {
                                    label.type = report_online_settings.always.types[i];
                                }
                                columns.push(label);
                            });
                        }
                        if (self.viewFields) {
                            if (!report_online_settings.hasOwnProperty("currents")) {
                                UI.log("wrong parse... report_online_settings.currents not set!");
                                return;
                            }
                            if (report_online_settings.currents.hasOwnProperty(self.viewFields) && report_online_settings.currents[self.viewFields].hasOwnProperty('fields')) {
                                _.each(report_online_settings.currents[self.viewFields].fields, function (field, i) {
                                    var label = {};
                                    label.title = (report_online_settings.currents[self.viewFields].hasOwnProperty('labels') && report_online_settings.currents[self.viewFields].labels[i]) ?
                                        report_online_settings.currents[self.viewFields].labels[i]
                                        :
                                        (App.i18n.exists('reports._' + deviceType.deviceTypeID + '.' + field) ?
                                                App.i18n.locale('reports._' + deviceType.deviceTypeID + '.' + field)
                                                :
                                                App.i18n.locale('reports.' + field)
                                        );
                                    if (report_online_settings.currents[self.viewFields].hasOwnProperty('types') && report_online_settings.currents[self.viewFields].types[i]) {
                                        label.type = report_online_settings.currents[self.viewFields].types[i];
                                    }
                                    columns.push(label);
                                });
                            }
                        } else {
                            UI.log('wrong... not calibrations fields for device');
                            return;
                        }
                        /* ********************* */
                        if (table.length == 0) {
                            html = '<table class="table" id="datatable-messages">' + footer + '</table>';
                            table = $(html).appendTo(self.jqueryNodeList.find('#report-div'));
                            if (calibration_json.params.hasOwnProperty('format_datetime')) {
                                //UI.log(moment.locale());
                                //$.fn.dataTable.moment(calibration_json.params.format_datetime, moment.locale());
                                $.extend($.fn.dataTableExt.oSort, {
                                    "datetime-pre": function (a) {
                                        return parseInt(moment(a, calibration_json.params.format_datetime).format("X"), 10);
                                    },
                                    "datetime-asc": function (a, b) {
                                        return a - b;
                                    },
                                    "datetime-desc": function (a, b) {
                                        return b - a;
                                    }
                                });
                            }
                            var t = table.DataTable({
                                language: {
                                    search: App.i18n.locale('text.search') + ":",
                                    emptyTable: App.i18n.locale('text.empty_list'),
                                    "paginate": {
                                        "first": App.i18n.locale('pagination.first'),
                                        "previous": App.i18n.locale('pagination.previous'),
                                        "next": App.i18n.locale('pagination.next'),
                                        "last": App.i18n.locale('pagination.last')
                                    }
                                },
                                bAutoWidth: false,
                                data: [],
                                columns: columns,
                                order: [[0, "desc"]],
                                dom: 'fbrtp',
                                buttons: [
                                    'pdf', 'excel', 'csv'
                                ],
                                footerCallback: function (row, data, start, end, display) {
                                    /*
                                     var api = this.api(), data;
                                     //UI.log(api);
                                     // Remove the formatting to get integer data for summation
                                     var intVal = function (i) {
                                     return typeof i === 'string' ?
                                     0 : typeof i === 'number' ?
                                     i : 0;
                                     };
                                     if (self.viewFields === 'inputs' || self.viewFields === 'tariffs') {
                                     // Total over all pages
                                     _.each(_.range(1, columns.length), function (l, i) {
                                     var total = api
                                     .column(l)
                                     .data()
                                     .reduce(function (a, b) {
                                     return intVal(a) + intVal(b);
                                     }, 0);
                                     // Total over this page
                                     var pageTotal = api
                                     .column(l, {page: 'current'})
                                     .data()
                                     .reduce(function (a, b) {
                                     return intVal(a) + intVal(b);
                                     }, 0);
                                     // Update footer
                                     $(api.column(l).footer()).html(
                                     pageTotal.toFixed(3) + ' [' + total.toFixed(3) + ']'
                                     );
                                     });
                                     }
                                     */
                                }
                            });
                            table.find('tbody').on('mouseenter', 'td', function () {
                                var colIdx = t.cell(this).index().column;
                                $(t.column(colIdx).nodes()).addClass('bg-muted');
                            }).on('mouseout', 'td', function () {
                                var colIdx = t.cell(this).index().column;
                                $(t.cells().nodes()).removeClass('bg-muted');
                            });
                            //t.buttons().addClass('btn-primary');
                            t.buttons().container().appendTo($('#datatable-messages_filter', t.table().container()));
                            $('#datatable-messages_filter').addClass('pull-right m-t-sm');
                        }
                        var error_value = '<span class="label label-' + App.environment.report_error_data_class + '">' + App.i18n.locale('text.error_data') + '</span>';
                        _.each(json.devices.messages, function (message, index) {
                            var element = [];
                            if (report_online_settings.hasOwnProperty('always') && report_online_settings.always.fields) {
                                _.each(report_online_settings.always.fields, function (field, i) {
                                    if (report_online_settings.always.hasOwnProperty('expressions') && report_online_settings.always.expressions[i]) {
                                        var $vars = calibration_json.vars;
                                        var $message = message;
                                        element.push(eval(report_online_settings.always.expressions[i]));
                                    } else {
                                        if (!message.hasOwnProperty(field)) {
                                            element.push(error_value);
                                        } else {
                                            element.push(message[field]);
                                        }
                                    }
                                });
                            }
                            if (self.viewFields) {
                                if (report_online_settings.currents.hasOwnProperty(self.viewFields) && report_online_settings.currents[self.viewFields].fields) {
                                    _.each(report_online_settings.currents[self.viewFields].fields, function (field, i) {
                                        var data = null;
                                        if (!message || !message.hasOwnProperty(field)) {
                                            data = error_value;
                                        } else if (message && calibration_json.hasOwnProperty('expressions') && calibration_json.expressions.hasOwnProperty(field)) {
                                            var $vars = calibration_json.vars;
                                            var $message = message;
                                            data = eval(calibration_json.expressions[field]);
                                        } else {
                                            data = message.hasOwnProperty(self.viewFields) ? message[self.viewFields][field] : message[field];
                                        }
                                        element.push(data);
                                    });
                                    //UI.log(element);
                                }
                            }
                            dataset.push(element);
                            //UI.log(dataset);
                        });
                        // update data
                        table.dataTable().fnClearTable();
                        table.dataTable().fnAddData(dataset);
                        self.chart = null;
                    } else {
                        var randomColor = function (a) {
                            var r = {};
                            r.alpha = a ? a : 1;
                            r.hex = Math.random().toString(16).slice(-6);
                            r.rgb = _.map(r.hex.match(/.{2}/g), function (c) {
                                return parseInt(c, 16);
                            });
                            r.rgbText = ('rgb(' + r.rgb.join(',') + ')');
                            r.rgbaText = ('rgba(' + r.rgb.join(',') + ',' + r.alpha + ')');
                            return r;
                        };
                        self.chart = null;
                        self.jqueryNodeList.find('#report-div').html('<div id="myChart" style="width:100%;min-height:600px;background-color:#FFFFFF;"></div>');
                        var chartData = {
                            graphs: [],
                            dataProvider: [],
                            format: 'DD MMMM YYYY HH:mm:ss'
                        };
                        // range field
                        /*
                         _.each(json.devices.messages, function (message) {
                         var format = 'DD.MM.YYYY HH:mm';
                         if (calibration_json.params.hasOwnProperty('format_datetime')) {
                         format = calibration_json.params.format_datetime;
                         }
                         chartData.labels.push(moment(message.datetime * 1000).format(format)); // timeline
                         });
                         */
                        var current = report_online_settings.currents;
                        var views = report_online_settings.params.views;
                        if (current.hasOwnProperty(self.viewFields) && current[self.viewFields].hasOwnProperty('fields')) {
                            chartData.format = 'DD MMMM YYYY HH:mm:ss';
                            if (calibration_json.params.hasOwnProperty('format_datetime')) {
                                chartData.format = calibration_json.params.format_datetime;
                            }
                            _.each(current[self.viewFields].fields, function (field, i) {
                                //var visible = ($.inArray(field, report_online_settings.currents[self.viewFields].fields) > -1) ? false : true;
                                var label = ((current[self.viewFields].hasOwnProperty('labels') && current[self.viewFields].labels[i]) ?
                                    current[self.viewFields].labels[i]
                                    :
                                    (App.i18n.exists('reports._' + deviceType.deviceTypeID + '.' + field) ?
                                            App.i18n.locale('reports._' + deviceType.deviceTypeID + '.' + field)
                                            :
                                            App.i18n.locale('reports.' + field)
                                    ));
                                _.each(App.devices.messages, function (message, c) {
                                    var data = {};
                                    var result = null;
                                    data.date = moment(message.datetime * 1000).format(chartData.format);
                                    if (!message || !message.hasOwnProperty(field)) {
                                        result = null;
                                    }
                                    else if (message && calibration_json.hasOwnProperty('expressions') && calibration_json.expressions.hasOwnProperty(field)) {
                                        var $vars = calibration_json.vars;
                                        var $message = message;
                                        result = eval(calibration_json.expressions[field]);
                                    } else {
                                        result = message[field];
                                    }
                                    data["column-" + self.viewFields + '-' + field] = result;
                                    if (chartData.dataProvider[c]) {
                                        $.extend(chartData.dataProvider[c], data);
                                        //UI.log(chartData.dataProvider[c]);
                                    } else {
                                        chartData.dataProvider.push(data);
                                    }

                                });
                                var graph = {
                                    "balloonText": "[[title]] " + App.i18n.locale('text.at_from') + " [[date]]: [[value]] ",
                                    "bullet": "round",
                                    "bulletSize": 10,
                                    "id": "AmGraph-" + i,
                                    "lineAlpha": 1,
                                    "lineThickness": 3,
                                    "title": label,
                                    "type": "smoothedLine",
                                    "valueField": "column-" + self.viewFields + '-' + field,
                                    "useLineColorForBulletBorder": true
                                }
                                if (views.hasOwnProperty('chart') && views.chart.hasOwnProperty('graphs') && views.chart.graphs.hasOwnProperty(field)) {
                                    $.extend(graph, views.chart.graphs[field]);
                                }
                                chartData.graphs.push(graph);
                                /*
                                 var getColor = function (a) {
                                 var color = randomColor(a);
                                 var rgb = color.rgb;
                                 if (rgb[0] > 160 || rgb[1] > 160 || rgb[2] > 160) {
                                 return getColor(a);
                                 }
                                 return color;
                                 };
                                 var color = getColor(.15);
                                 //UI.log(label + ' -> ' + color.rgbText);
                                 */
                                /*
                                 chartData.datasets.push({
                                 label: label,
                                 borderColor: color.rgbText,
                                 backgroundColor: color.rgbaText,
                                 fill: true,
                                 data: data,
                                 viewFields: self.viewFields,
                                 });
                                 */
                            });
                        }
                        //UI.log(self);
                        var chart_params = {
                            "language": App.locale,
                            "type": "serial",
                            "categoryField": "date",
                            //"mouseWheelZoomEnabled": true,
                            //"mouseWheelScrollEnabled": true,
                            "autoMarginOffset": 40,
                            "marginRight": 60,
                            "marginTop": 60,
                            //"maxZoomFactor": 500,
                            "fontSize": 13,
                            "theme": "light",
                            "legend": {
                                "equalWidths": true,
                                "periodValueText": "",
                                "position": "bottom",
                                "valueAlign": "left"
                                //"valueWidth": 100
                            },
                            "categoryAxis": {
                                "gridPosition": "start",
                                "position": "top",
                                "startOnAxis": true,
                                "equalSpacing": true,
                                "parseDates": true,//parseInt(self.grouping),
                                //"labelRotation": (!parseInt(self.grouping) ? 60: 0),
                                //"ignoreAxisWidth": true,
                                //"autoWrap": true,
                                "minPeriod": (!parseInt(self.grouping) ? "hh" : "DD"),
                                /**/
                                "minHorizontalGap": 40,
                                "dateFormats": [{
                                    period: 'fff',
                                    format: 'JJ:NN:SS'
                                }, {
                                    period: 'ss',
                                    format: 'JJ:NN:SS'
                                }, {
                                    period: 'mm',
                                    format: 'JJ:NN'
                                }, {
                                    period: 'hh',
                                    format: 'JJ:NN'
                                }, {
                                    period: 'DD',
                                    format: 'MMM DD'
                                }, {
                                    period: 'WW',
                                    format: 'MMM DD'
                                }, {
                                    period: 'MM',
                                    format: 'MMMM YYYY'
                                }, {
                                    period: 'YYYY',
                                    format: 'MMMM YYYY'
                                }]
                            },
                            "export": {
                                "enabled": true
                            },
                            "dataDateFormat": chartData.format,
                            "chartCursor": {
                                "enabled": true,
                                "categoryBalloonDateFormat": (!parseInt(self.grouping) ? "DD MMMM YYYY" : "DD MMMM YYYY"),
                                "cursorAlpha": 0,
                                "fullWidth": true
                            },
                            "chartScrollbar": {
                                "enabled": true,
                                "scrollbarHeight": 50

                            }
                            ,
                            "trendLines": [],
                            "graphs": chartData.graphs,
                            "guides": [],
                            "valueAxes": [
                                {
                                    "id": "ValueAxis-1",
                                    "title": ""
                                }
                            ],
                            "allLabels": [],
                            "balloon": {},
                            "titles": [],
                            "dataProvider": chartData.dataProvider
                        };
                        self.chart = AmCharts.makeChart("myChart", chart_params);
                        //UI.log(self.chart);
                        /*
                         var chartData = {
                         labels: [],
                         datasets: []
                         };
                         // range field
                         _.each(json.devices.messages, function (message) {
                         var format = 'DD.MM.YYYY HH:mm';
                         if (calibration_json.params.hasOwnProperty('format_datetime')) {
                         format = calibration_json.params.format_datetime;
                         }
                         chartData.labels.push(moment(message.datetime * 1000).format(format)); // timeline
                         });
                         var current = report_online_settings.currents;
                         if (current.hasOwnProperty(self.viewFields) && current[self.viewFields].hasOwnProperty('fields')) {
                         _.each(current[self.viewFields].fields, function (field, i) {
                         var visible = ($.inArray(field, report_online_settings.currents[self.viewFields].fields) > -1) ? false : true;
                         var label = ((current[self.viewFields].hasOwnProperty('labels') && current[self.viewFields].labels[i]) ?
                         current[self.viewFields].labels[i]
                         :
                         (App.i18n.exists('reports._' + deviceType.deviceTypeID + '.' + field) ?
                         App.i18n.locale('reports._' + deviceType.deviceTypeID + '.' + field)
                         :
                         App.i18n.locale('reports.' + self.viewFields + '.' + field)
                         ));
                         var data = [];
                         _.each(App.devices.messages, function (message) {
                         if (!message || !message.hasOwnProperty(self.viewFields) || !message[self.viewFields].hasOwnProperty(field)) {
                         data.push(null);
                         }
                         else if (message && calibration_json.hasOwnProperty('expressions') && calibration_json.expressions.hasOwnProperty(self.viewFields) && calibration_json.expressions[self.viewFields].hasOwnProperty(field)) {
                         var $vars = calibration_json.vars;
                         var $message = message;
                         data.push(eval(calibration_json.expressions[self.viewFields][field]));
                         } else {
                         data.push(message[self.viewFields][field]);
                         }
                         });
                         var getColor = function (a) {
                         var color = randomColor(a);
                         var rgb = color.rgb;
                         if (rgb[0] > 160 || rgb[1] > 160 || rgb[2] > 160) {
                         return getColor(a);
                         }
                         return color;
                         };
                         var color = getColor(.15);
                         //UI.log(label + ' -> ' + color.rgbText);
                         chartData.datasets.push({
                         label: label,
                         borderColor: color.rgbText,
                         backgroundColor: color.rgbaText,
                         fill: true,
                         data: data,
                         viewFields: self.viewFields,
                         });
                         });
                         }
                         if (self.chart) {
                         //self.chart.data.labels = [];
                         self.chart.data.labels = chartData.labels;
                         if (self.chart.data.datasets.length > chartData.datasets.length) {
                         self.chart.data.datasets.splice(chartData.datasets.length - 1, chartData.datasets.length);
                         } else {
                         self.chart.data.datasets.push({data: null});
                         }
                         _.each(chartData.datasets, function (dataset, i) {
                         self.chart.data.datasets[i].data = chartData.datasets[i].data;
                         });
                         self.chart.update();
                         } else {
                         self.jqueryNodeList.find('#report-div').html('');
                         var ctx = document.getElementById("myChart");
                         if (!ctx) {
                         //UI.log(chartData.datasets);
                         var height = chartData.datasets.length > 10 ? 125 : 100;
                         self.jqueryNodeList.find('#report-div').html('<canvas id="myChart" height="' + height + '"></canvas>');
                         ctx = document.getElementById("myChart").getContext('2d');
                         } else {
                         ctx = ctx.getContext('2d');
                         }
                         self.chart = new Chart.Line(ctx, {
                         data: chartData,
                         options: {
                         responsive: true,
                         legend: {
                         position: 'bottom'
                         },
                         pan: {
                         // Boolean to enable panning
                         enabled: true,

                         // Panning directions. Remove the appropriate direction to disable
                         // Eg. 'y' would only allow panning in the y direction
                         mode: 'x',
                         //speed: 50,
                         //threshold: 50
                         },
                         // Container for zoom options
                         zoom: {
                         // Boolean to enable zooming
                         enabled: true,
                         drag: true,

                         // Zooming directions. Remove the appropriate direction to disable
                         // Eg. 'y' would only allow zooming in the y direction
                         //mode: 'x',
                         //sensitivity: 50,
                         /*
                         limits: {
                         max: 10,
                         min: 0.5
                         }
                         }
                         }
                         });

                         _.each(self.chart.data.datasets, function (dataset, i) {
                         var meta = self.chart.getDatasetMeta(i);
                         UI.log(meta);
                         meta.hidden = meta.hidden === null? !dataset.hidden : null;
                         });

                         //self.chart.update();
                         }*/
                    }
                });
            },
            setFilterHTML: function () {
                var self = this;
                self.daterangeHTML();
                self.viewHTML();
                $('<div><br/><br/></div>').appendTo(self.jqueryNodeList);
                $('<div id="report-div" class="m-t-sm" align="center"></div>').appendTo(self.jqueryNodeList);
                var device = _.findWhere(App.devices.devices, {id: self.deviceId});
                var deviceType = _.findWhere(App.devices.device_types, {id: device.device_type_id});
                if (!deviceType.calibration_json) {
                    self.jqueryNodeList.find('#report-div').html('<div class="text-center">' + App.i18n.locale('text.device_is_gateway') + '</div>');
                    return;
                }
            },
            daterangeHTML: function () {
                var self = this;
                var device = _.findWhere(App.devices.devices, {id: self.deviceId});
                var deviceType = _.findWhere(App.devices.device_types, {id: device.device_type_id});
                var calibration_json = JSON.parse(deviceType.calibration_json);
                if (!calibration_json) {
                    return;
                }
                var html = '<div class="pull-left m-b-sm input-group period-filter width-300">' +
                    '<span class="input-group-addon no-border">' + App.i18n.locale('text.period') + ':</span>' +
                    '<input type="text" class="form-control width-300 text-center" readonly="readonly" id="input-daterange" value=""/>' +
                    '<div class="input-group-btn"><button class="btn btn-info btn-calendar"><i class="fa fa-fw fa-calendar"></i></button>' +
                    '<span><i class="pull-right m-t-xs m-l-xs fa fa-fw fa-refresh fa-spin state-loading hide"></i></span></div>' +
                    '</div>';
                html = $(html);
                html.find('.btn-calendar').click(function (e) {
                    //UI.log(html.find('#input-daterange').data());
                    html.find('#input-daterange').data('dateRangePicker').open();
                    e.preventDefault();
                    e.stopPropagation();
                });
                html.find('#input-daterange').dateRangePicker({
                    format: 'DD MMMM YYYY',
                    startOfWeek: 'monday',
                    language: App.locale,
                    separator: ' ' + App.i18n.locale('text.to') + ' '
                });
                self.jqueryNodeFilterApply = $('.date-picker-wrapper').find('.apply-btn');
                html.find('#input-daterange').on('datepicker-change, datepicker-apply', function (ev, picker) {
                    var timestampBegin = parseInt(moment(picker.date1).startOf("day").valueOf() / 1000);
                    var timestampEnd = parseInt(moment(picker.date2).endOf("day").valueOf() / 1000);
                    $(this).val(picker.value);
                    self.jqueryNodeFilterApply.attr('timestampbegin', timestampBegin);
                    self.jqueryNodeFilterApply.attr('timestampend', timestampEnd);
                    UI.log('show report data: ' + new Date(timestampBegin * 1000).toLocaleString() + ' - ' + new Date(timestampEnd * 1000).toLocaleString());
                    html.find('#input-daterange').data('dateRangePicker').close();
                    self.skip = false;
                    self.online();
                });
                html.find('#input-daterange').data('dateRangePicker').setStart(moment().format('DD MMMM YYYY')).setEnd(moment().format('DD MMMM YYYY'));
                html.appendTo(self.jqueryNodeList);
                return self;
            },
            viewHTML: function () {
                var self = this;
                var device = _.findWhere(App.devices.devices, {id: self.deviceId});
                var deviceType = _.findWhere(App.devices.device_types, {id: device.device_type_id});
                var report_online_settings = JSON.parse(device.report_online_settings || deviceType.report_online_settings);
                if (!report_online_settings) {
                    UI.log('Error! Not calibrations default of device type');
                    return;
                }
                var views = report_online_settings.params.views;
                var branches = report_online_settings.params.branches;
                var html = '<div class="pull-right">';
                html += '<div class="pull-right btn-group m-l-sm" title="' + App.i18n.locale('text.available_fields') + '" data-toggle="tooltip">' +
                    //'<button type="button" class="btn btn-warning"><i class="fa fa-fw fa-filter"></i></button>' +
                    '<button type="button" class="btn btn-warning dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
                    '<i class="fa fa-fw fa-filter"></i>' +
                    '<span class="sr-only">Toggle Dropdown</span>' +
                    '</button>' +
                    '<ul class="dropdown-menu">';
                var fields_visible = [];
                _.each(branches.items, function (item) {
                    /*_.each(report_online_settings.currents[item].fields, function (field) {
                        fields_visible[item] = field;
                    });*/
                    fields_visible = _.union(fields_visible, report_online_settings.currents[item].fields);
                });
                //console.log(fields_visible);
                _.each(report_online_settings.available.fields, function (field, idx) {
                    var checked = ($.inArray(field, fields_visible) > -1) ? 1 : 0;
                    //UI.log('reports.' + deviceType.deviceTypeID + '.' + field);
                    var label = (report_online_settings.available.hasOwnProperty('labels') ?
                        report_online_settings.available['labels'][idx]
                        :
                        (App.i18n.exists('reports._' + deviceType.deviceTypeID + '.' + field) ?
                                App.i18n.locale('reports._' + deviceType.deviceTypeID + '.' + field)
                                :
                                App.i18n.locale('reports.' + field)
                        ));
                    html += '<li><a href="#" class="filter-field" data-selected="' + (checked ? 1 : 0) + '" data-field="' + field + '">';
                    html += checked ? '<i class="fa fa-fw fa-check"></i>&#160;&#160;' : '';
                    html += checked ? ('<b>' + label + '</b>') : label;
                    html += '</a></li>';
                });
                //html += (i + 1 !== branches.items.length) ? '<li role="separator" class="divider"></li>' : '';
                html += '</ul>' +
                    '</div>';
                html += (App.user.access.devices.update ? '<button class="pull-right m-l-lg btn btn-success btn-device-calibration" data-device-id="' + self.deviceId + '" title="' + App.i18n.locale('text.settings') + '" data-toggle="tooltip"><i class="fa fa-fw fa-cogs"></i></button>' : '');
                html += '<div class="pull-right m-l-sm">';
                var groups = [
                    {id: 0, icon: "fa-battery-4", title: App.i18n.locale('text.without_grouping')},
                    {id: 1, icon: "fa-battery-4", title: App.i18n.locale('text.by_days_grouping')},
                    {id: 2, icon: "fa-battery-3", title: App.i18n.locale('text.by_weeks_grouping')},
                    {id: 3, icon: "fa-battery-2", title: App.i18n.locale('text.by_months_grouping')},
                    {id: 4, icon: "fa-battery-2", title: App.i18n.locale('text.by_quarter_grouping')},
                    {id: 5, icon: "fa-battery-1", title: App.i18n.locale('text.by_year_grouping')}
                ];
                html += UI.select.create(groups, {
                    selectName: 'grouping',
                    activeItemId: 1
                });
                html += '</div>';
                html += '<div class="pull-right btn-group btn-view-as" data-toggle="buttons">';
                _.each(views.items, function (item, i) {
                    var checked = (i === 0) ? 'checked="checked"' : '';
                    html += '<label class="btn btn-primary ' + (checked ? 'active' : '') + '" title="' + App.i18n.locale('reports.shown.' + item) + '" data-toggle="tooltip">' +
                        '<input type="radio" name="options" value="' + item + '" autocomplete="off" ' + checked + '><i class="fa fa-fw ' + (views.icons && views.icons[i] ? views.icons[i] : 'fa-question') + '"></i>' +
                        '</label>';
                });
                html += '</div>' +
                    '<div class="pull-right m-r-lg btn-group btn-fields" data-toggle="buttons">';
                //UI.log(branches.items);
                _.each(branches.items, function (item, i) {
                    var checked = (i === 0) ? 'checked="checked"' : '';
                    html += '<label class="btn btn-default ' + (checked ? 'active' : '') + '" title="' + String(App.i18n.locale('reports.divisions.' + item)).toUpperCase() + '" data-toggle="tooltip">' +
                        '<input type="radio" name="fields" value="' + item + '" autocomplete="off" ' + checked + '><i class="fa fa-fw ' + (branches.icons && branches.icons[i] ? branches.icons[i] : 'fa-question') + '"></i>' +
                        '</label>';
                });
                html += '</div>' +
                    '</div>';
                html = $(html);
                html.appendTo(self.jqueryNodeList);
                App.showTooltip(html);
                //
                html.find('select').selectpicker({
                    width: 'auto',
                    style: 'btn-warning',
                    dropdownAlignRight: false,
                    showTick: true
                }).on('changed.bs.select', function (e) {
                    if (App.license.level < 2 && $(this).val() > 3) {
                        html.find('select').selectpicker('val', 1);
                        App.license.upgradeConfirm();
                        UI.log('check license');
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }
                    self.grouping = $(this).val();
                    self.skip = false;
                    self.online();
                });
                html.find('.filter-field').click(function (e) {
                    var a = $(this);
                    var text = a.text().trim();
                    var device = _.findWhere(App.devices.devices, {id: self.deviceId});
                    var deviceType = _.findWhere(App.devices.device_types, {id: device.device_type_id});
                    a.html(parseInt(a.data('selected')) ? text : ('<i class="fa fa-fw fa-check"></i>&#160;&#160;<b>' + text + '</b>'));
                    a.data('selected', parseInt(a.data('selected')) ? 0 : 1);
                    self.skip = false;
                    var report_online_settings = JSON.parse(self.report_online_settings || device.report_online_settings || deviceType.report_online_settings);
                    if (parseInt(a.data('selected'))) {
                        report_online_settings.currents[self.viewFields].fields.push(a.data('field'));
                    } else {
                        report_online_settings.currents[self.viewFields].fields.splice(report_online_settings.currents[self.viewFields].fields.indexOf(a.data('field')), 1);
                    }
                    self.report_online_settings = device.report_online_settings = JSON.stringify(report_online_settings);
                    self.grouping = html.find('select').val();
                    self.online();
                    e.stopPropagation();
                });
                html.find('.btn-device-calibration').click(function () {
                    var report_online_settings = JSON.parse(device.report_online_settings);
                    var calibration_json = JSON.parse(device.calibration_json);
                    var modal = UI.modal.confirm({
                        title: App.i18n.locale('text.settings'),
                        content: '<div></div>',
                        size: 'lg',
                        i18nUse: {
                            object: App.i18n,
                            prefix: 'text.'
                        },
                        afterCreate: function () {
                            var content = this.getContent();
                            UI.pageControl.create({
                                jqueryNode: content,
                                tabNames: [App.i18n.locale('text.calibration'), App.i18n.locale('text.settings_views')],
                                tabContents: ['', '<b>setting views branches</b>'],
                                tabEvents: [function () {
                                    //UI.log('calibration');
                                    var items = [];
                                    var origin_expressions = _.clone(calibration_json.expressions);
                                    var i = 0;
                                    _.each(report_online_settings.available.fields, function (field, i) {
                                        items.push({
                                            id: (i + 1),
                                            name: field,
                                            //group_id: groupName,
                                            //group: App.i18n.locale('reports.divisions.' + groupName),
                                            title: (App.i18n.exists('reports._' + deviceType.deviceTypeID + '.' + field) ? App.i18n.locale('reports._' + deviceType.deviceTypeID + '.' + field) : App.i18n.locale('reports.' + field))
                                        });
                                    });
                                    var select = UI.select.create(items, {
                                        selectName: 'entrances',
                                        dataFields: ['name']
                                    });
                                    var tabContent = this.tabs[0].content.find('.panel-body');
                                    var selectDropdown = null;
                                    tabContent.html('<div>' +
                                        '<div class="row m-b-sm"><div class="col-md-12">' + select + '</div></div>' +
                                        '<fieldset class="hide" disabled="disabled">' +
                                        '<div class="row btn-operands">' +
                                        '<div class="col-md-6" style="max-height:180px;overflow:auto;" id="calibration-vars" align="center">' + App.i18n.locale('text.available_vars') + ':<br/></div>' +
                                        '<div class="col-md-6" id="calibration-operations" align="center">' + App.i18n.locale('text.available_operands') + ':<br/>' +
                                        '<div class="btn-group btn-group-sm m-xs">' +
                                        '<button type="button" class="btn btn-default width-35" value="+">+</button>' +
                                        '<button type="button" class="btn btn-default width-35" value="-">-</button>' +
                                        '<button type="button" class="btn btn-default width-35" value="/">/</button>' +
                                        '<button type="button" class="btn btn-default width-35" value="*">*</button>' +
                                        '<button type="button" class="btn btn-default width-35" value="(">(</button>' +
                                        '<button type="button" class="btn btn-default width-35" value=")">)</button>' +
                                        '</div>' +
                                        '</div>' +
                                        '</div>' +
                                        '<div class="row hide"><hr/><div class="col-md-12" id="calibration-expressions"></div></div>' +
                                        '<div class="row hide"><hr/><div class="col-md-12" id="calibration-test"></div></div>' +
                                        '</fieldset>' +
                                        '<textarea class="form-control hide" rows="15"></textarea>' +
                                        '</div>');
                                    var attrs = _.where(device.attributes, {type: 'var'});
                                    var btn_new = $('<button class="btn btn-primary btn-sm m-xs width-90p">' + App.i18n.locale('text.new_var') + '</button>');
                                    btn_new.click(function () {
                                        modal.hide();
                                        var tab = $('a[data-action="json.devices.property"]');
                                        //UI.log(tab);
                                        tab.trigger('click');
                                        setTimeout(function () {
                                            var tabBody = $('#device-property .panel-body');
                                            tabBody.find('#attribute_id').selectpicker('val', '0').trigger('changed.bs.select');
                                            tabBody.find('#attribute_type').selectpicker('val', '4').trigger('changed.bs.select');
                                            tabBody.find('[name=property-title]').focus();
                                            //tabBody.find('#attribute_id').selectpicker('refresh');
                                        }, 1);
                                    });
                                    tabContent.find('#calibration-vars').append(btn_new);
                                    _.each(attrs, function (attr, i) {
                                        var new_var = UI.transliterate(attr.title, {
                                            isProperty: true
                                        });
                                        attrs[i].translition = new_var;
                                        calibration_json.vars[new_var] = attr.value;
                                        tabContent.find('#calibration-vars').append($('<a type="button" class="btn btn-info btn-sm m-xs width-90p" data-name="$vars[\'' + new_var + '\']" value="' + attr.value + '">' + attr.title + ' = ' + attr.value + '</a><br/>'));
                                    });
                                    var select = tabContent.find('select').selectpicker({
                                        width: '100%',
                                        style: 'btn-default',
                                        showTick: true,
                                        title: App.i18n.locale('text.choose_input'),
                                        size: 10
                                    }).on('loaded.bs.select', function () {
                                        selectDropdown = tabContent.find('.bootstrap-select button');
                                        selectDropdown.click(function () {
                                            this.blur();
                                        });
                                    });
                                    select.on('changed.bs.select', function () {
                                        // change for input
                                        var expression_array = [];
                                        var expression = '';

                                        var fieldset = tabContent.find('fieldset');
                                        fieldset.removeClass('hide');
                                        fieldset.removeAttr('disabled');
                                        selectDropdown.click();
                                        var option = select.find('option[value=' + select.val() + ']');
                                        //var group = option.data('group_id');
                                        var input = option.data('name');
                                        var parse = function (expr, currVal) {
                                            var new_expr = expr;
                                            var regExp = new RegExp(/\$vars\['(.+?)']/, 'g');
                                            var found = String(expr).match(regExp);
                                            //UI.log(found);
                                            _.each(found, function (i) {
                                                //UI.log(i);
                                                var c = i.match(new RegExp(/'(.*)'/));
                                                //UI.log(c);
                                                if (c) {
                                                    var r = '<b class="label label-info">' + _.findWhere(attrs, {translition: c[1]}).title + '</b>';
                                                    new_expr = String(new_expr).split(i).join(r);
                                                }
                                            });
                                            if (currVal) {
                                                var regExp = new RegExp("\\$message\\['" + currVal.input + "']", 'g');
                                                var c = new_expr.match(regExp);
                                                if (c) {
                                                    var r = '<b class="label label-success">' + (App.i18n.exists('reports._' + deviceType.deviceTypeID + '.' + currVal.input) ? App.i18n.locale('reports._' + deviceType.deviceTypeID + '.' + currVal.input) : App.i18n.locale('reports.' + currVal.input)) + '</b>';
                                                    new_expr = String(new_expr).split(c[0]).join(r);//replace(new RegExp(c[0], 'g'), r);
                                                }
                                            }
                                            return new_expr;
                                        };
                                        tabContent.find('#calibration-operations').find('a, div[role=group]').remove();
                                        tabContent.find('#calibration-operations').append($('<a type="button" class="btn btn-success btn-sm m-xs width-90p" data-name="$message[\'' + input + '\']">' + (App.i18n.exists('reports._' + deviceType.deviceTypeID + '.' + input) ? App.i18n.locale('reports._' + deviceType.deviceTypeID + '.' + input) : App.i18n.locale('reports.' + input)) + '</a>'));
                                        tabContent.find('#calibration-operations').append($('<div class="btn-group btn-group-justified m-xs width-90p" role="group">' +
                                            '<div class="btn-group btn-group-sm" role="group"><button class="btn btn-warning btn-expression-backspace disabled"><i class="fa fa-long-arrow-left"></i>&#160;' + App.i18n.locale('text.backspace') + '</button></div>' +
                                            '<div class="btn-group btn-group-sm" role="group"><button class="btn btn-danger btn-expression-clear disabled"><i class="fa fa-remove"></i>&#160;' + App.i18n.locale('text.clear') + '</button></div>' +
                                            '</div>'));
                                        tabContent.find('#calibration-expressions').html('');
                                        tabContent.find('#calibration-expressions').parent().removeClass('hide');
                                        var f = $('<div class="m-xs"><span>' + App.i18n.locale('text.formula') + '</span><br/>' +
                                            '<div align="center"><b><span class="label label-default">' + App.i18n.locale('reports.' + input) + '</span></b></div>' +
                                            '</div>').appendTo(tabContent.find('#calibration-expressions'));
                                        tabContent.find('.btn-expression-clear').click(function () {
                                            var btn = $(this);
                                            if (btn.hasClass('disabled')) {
                                                return false;
                                            }
                                            f.find('b').html('');
                                            expression_array = [];
                                            expression = "";
                                            if (Object.keys(origin_expressions[input]).length <= 1) {
                                                delete origin_expressions[input];
                                            }
                                            tabContent.find('.btn-expression-test').addClass('disabled');
                                            tabContent.find('.btn-expression-test').addClass('disabled');
                                            tabContent.find('.btn-expression-backspace').addClass('disabled');
                                            calibration_json.expressions = origin_expressions;
                                            //UI.log(calibration_json);
                                        });
                                        tabContent.find('.btn-expression-backspace').click(function () {
                                            var btn = $(this);
                                            if (btn.hasClass('disabled')) {
                                                return false;
                                            }
                                            expression_array.pop();
                                            expression = expression_array.join(' ').trim();
                                            var parsed_string = parse(expression, {
                                                input: input
                                            });
                                            f.find('b').html(parsed_string);
                                            origin_expressions[input] = expression;
                                            if (!expression_array.length) {
                                                tabContent.find('.btn-expression-test').addClass('disabled');
                                                tabContent.find('.btn-expression-clear').addClass('disabled');
                                                tabContent.find('.btn-expression-backspace').addClass('disabled');
                                                if (Object.keys(origin_expressions[input]).length <= 1) {
                                                    delete origin_expressions[input];
                                                }
                                            }
                                            calibration_json.expressions = origin_expressions;
                                            //UI.log(calibration_json);
                                        });
                                        tabContent.find('#calibration-test').html('');
                                        tabContent.find('#calibration-test').parent().removeClass('hide');
                                        var t = $('<div class="m-xs"><span>' + App.i18n.locale('text.testing') + '</span><br/><br/>' +
                                            '<div class="input-group">' +
                                            '<input class="form-control" id="test_in" placeholder="' + App.i18n.locale('text.value_for') + ' ' + (App.i18n.exists('reports._' + deviceType.deviceTypeID + '.' + input) ? App.i18n.locale('reports._' + deviceType.deviceTypeID + '.' + input) : App.i18n.locale('reports.' + input)) + '"/>' +
                                            '<div class="input-group-btn"><button class="btn btn-primary btn-expression-test">' + App.i18n.locale('text.test') + '</button></div>' +
                                            '<input class="form-control" id="result" placeholder="' + App.i18n.locale('text.result') + '"/>' +
                                            '</div>' +
                                            '</div>').appendTo(tabContent.find('#calibration-test'));
                                        t.find('button').click(function () {
                                            var btn = $(this);
                                            if (btn.hasClass('disabled')) {
                                                return false;
                                            }
                                            //UI.log('test:');
                                            //$message[group][select.val()] = 1;
                                            //UI.log(expression_array);
                                            var expr = expression_array.join(' ').trim();
                                            if (expr) {
                                                var result;
                                                try {
                                                    var $vars = calibration_json.vars;
                                                    var $message = JSON.parse('{"' + input + '": ' + t.find('#test_in').val() + '}');
                                                    result = eval(expr);
                                                } catch (e) {
                                                    result = App.i18n.locale('text.error_in_expression');
                                                }
                                                t.find('#result').val(result);
                                            }
                                        });
                                        tabContent.find('.btn-operands [type=button]').off().click(function () {
                                            this.blur();
                                            var v = $(this).val();
                                            if (!v) {
                                                v = $(this).data('name');
                                            }
                                            expression_array.push(v);
                                            //UI.log(group);
                                            //UI.log(input);
                                            expression = expression_array.join(' ').trim();
                                            var parsed_string = parse(expression, {
                                                input: input
                                            });
                                            f.find('b').html(parsed_string);
                                            if (expression != '') {
                                                /*
                                                if (!origin_expressions.hasOwnProperty(group)) {
                                                    origin_expressions[input] = {};//JSON.parse('{"' + group + '": null}');
                                                }
                                                */
                                                origin_expressions[input] = expression;
                                            } else {
                                                if (Object.keys(origin_expressions[input]).length <= 1) {
                                                    delete calibration_json.expressions[input];
                                                }
                                            }
                                            calibration_json.expressions = origin_expressions;
                                            tabContent.find('.btn-expression-clear').removeClass('disabled');
                                            tabContent.find('.btn-expression-backspace').removeClass('disabled');
                                            //UI.log(parsed_string);
                                            //UI.log(expression);
                                            //UI.log(calibration_json);
                                        });
                                        /////
                                        if (origin_expressions.hasOwnProperty(input)) {
                                            expression = origin_expressions[input];
                                        }
                                        if (expression) {
                                            var parsed_string = parse(expression, {
                                                input: input
                                            });
                                            f.find('b').html(parsed_string);
                                            tabContent.find('.btn-expression-test').removeClass('disabled');
                                            tabContent.find('.btn-expression-clear').removeClass('disabled');
                                            tabContent.find('.btn-expression-backspace').removeClass('disabled');
                                            //UI.log(calibration_json);
                                            var regExp = new RegExp(/\+|-|\*|\/|\(|\)/, 'g');
                                            var operands = expression.match(regExp);
                                            _.each(expression.split(regExp), function (n, i) {
                                                var v = String(n).trim();
                                                if (v != "") {
                                                    expression_array.push(v);
                                                }
                                                if (operands && operands.length && operands[i]) {
                                                    expression_array.push(operands[i]);
                                                }
                                            });
                                        }
                                    });
                                    //this.loadingHide();
                                }, function () {
                                    UI.log('settings');
                                }],
                                afterCreate: function () {
                                    this.loadingHide();
                                }
                            });
                            /*
                             var json = JSON.stringify(calibration_json, undefined, 2);
                             var textarea = content.find('textarea');
                             textarea.val(json);
                             textarea.on('keyup', function () {
                             try {
                             JSON.parse(textarea.val());
                             textarea.removeClass('bg-warning-light');
                             } catch (e) {
                             textarea.addClass('bg-warning-light');
                             }
                             });
                             */
                        },
                        onOk: function () {
                            /*
                             var textarea = this.getContent('textarea');
                             var json = null;
                             try {
                             json = JSON.parse(textarea.val());
                             } catch (e) {
                             textarea.addClass('bg-danger');
                             textarea.one('keyup', function () {
                             textarea.removeClass('bg-danger');
                             });
                             return false;
                             }
                             */
                            //UI.log(JSON.stringify(calibration_json));
                            //return;
                            UI.action('json.devices.calibration.save', {
                                deviceId: self.deviceId,
                                json: JSON.stringify(calibration_json)
                            });
                            device.calibration_json = JSON.stringify(calibration_json);
                            modal.hide();
                            self.skip = false;
                            self.online();
                        }
                    });
                    modal.show();
                });
                var btnTypes = html.find('.btn-fields label');
                _.each(branches.items, function (branch) {
                    html.find('.btn-fields input[value=' + branch + ']').parent().switchClass('btn-default', 'btn-info', 0);
                });
                html.find('.btn-fields label.btn-default').addClass('hide');
                html.find('.btn-fields input[name=fields]').change(function () {
                    var btn = $(this);
                    if (btn.parent().hasClass('disabled')) {
                        return;
                    }
                    self.skip = true;
                    self.online({
                        timestampBegin: self.timestampBegin,
                        timestampEnd: self.timestampEnd,
                        viewAs: self.viewAs,
                        viewFields: btn.val(),
                        grouping: self.grouping,
                        jqueryNode: self.jqueryNodeList
                    });
                });
                self.viewFields = html.find('.btn-fields input[name=fields]:eq(0)').val();
                html.find('.btn-fields label').click(function () {
                    var btn = $(this);
                    btn.removeClass('active');
                    setTimeout(function () {
                        btn.removeClass('focus');
                        btn.blur();
                    }, 100);
                });
                ///
                //UI.log(html.find('.btn-fields input[name=fields]:eq(0)'));
                html.find('.btn-view-as input[name=options]').change(function () {
                    var btn = $(this);
                    self.skip = false;
                    self.online({
                        timestampBegin: self.timestampBegin,
                        timestampEnd: self.timestampEnd,
                        viewAs: btn.val(),
                        viewFields: self.viewFields,
                        grouping: self.grouping,
                        jqueryNode: self.jqueryNodeList
                    });
                });
                html.find('.btn-view-as label').click(function () {
                    var btn = $(this);
                    btn.removeClass('active');
                    setTimeout(function () {
                        btn.removeClass('focus');
                        btn.blur();
                    }, 100);
                });
            }
        },
        notifications: {
            obj: null,
            messages: [],
            timestamp_begin: moment().startOf('day').format('X'),
            timestamp_end: moment().endOf('day').format('X'),
            modalCenterMessages: null,
            jqueryNodeAllMessages: null,
            init: function () {
                var self = this;
                self.obj = $('.notifications');
                self.obj.find('.notifications-messages').css({
                    'max-height': '583px',
                    'overflow-y': 'scroll'
                });
                if (self.obj.length && self.messages.length) {
                    self.renderFlyHTML();
                    self.renderCounter();
                }
            },
            renderAllMessages: function () {
                var self = this;
                self.modalCenterMessages.__state('loading');
                self.jqueryNodeAllMessages.html('');
                $.when(UI.action('json.notifications.messages', {
                    timestamp_begin: self.timestamp_begin,
                    timestamp_end: self.timestamp_end
                })).then(function () {
                    self.modalCenterMessages.__state('free');
                    var html = '<tr class="width-100p"><td class="width-100p text-center">' + App.i18n.locale('text.no_messages_at_period') + '</td></tr>';
                    if (self.messages.length) {
                        html = '';
                        _.each(_.sortBy(self.messages, 'datetime'), function (message) {
                            html += '<tr class="width-100p">' +
                                '<td class="width-20 text-center">' +
                                (message.reading ?
                                        '<i class="fa fa-fw fa-envelope-open-o" data-toggle="tooltip" data-placement="bottom" title="' + App.i18n.locale('text.message_readed') + ':<br/> ' + moment(message.reading).format('DD MMMM YYYY') + '"></i>'
                                        :
                                        '<a href="javascript:void(0);" data-message-id="' + message.id + '" data-toggle="tooltip" data-placement="bottom" title="' + App.i18n.locale('text.notification_messages_set_read') + '"><i class="fa fa-fw fa-envelope"></i></a>'
                                ) + '</td>' +
                                '<td class="width-180 text-center">' + moment(message.datetime * 1000).format('DD MMMM YYYY HH:mm') + '</td>' +
                                '<td>' +
                                message.text
                                + '</td>' +
                                '</tr>';
                        });
                    }
                    self.jqueryNodeAllMessages.html(html);
                    self.jqueryNodeAllMessages.find('a[data-device-id]').click(function () {
                        var a = $(this);
                        var deviceId = a.data('device-id');
                        $.when(UI.action('json.devices.one', {
                            deviceId: deviceId
                        })).then(function () {
                            self.modalCenterMessages.hide();
                            var content = $('<div>' + App.devices.templateDeviceForm(deviceId) + '</div>');
                            App.contentManagement.push({
                                backListText: App.i18n.locale('text.back_to_the_list_of_devices'),
                                contexts: {
                                    prev: {
                                        context: App.devices,
                                        content: $('.ibox-content'),
                                        renderFunctions: App.devices.render,
                                        args: [$('.ibox-content')]
                                    },
                                    new: {
                                        context: App.devices,
                                        content: content,
                                        renderFunctions: App.devices.templateDeviceFormBinds,
                                        args: [deviceId, content, {}]
                                    }
                                }
                            });
                        });
                    }).addClass('text-navy');
                    self.jqueryNodeAllMessages.find('a[data-message-id]').click(function () {
                        var a = $(this);
                        var messageId = a.data('message-id');
                        $.when(self.setMessageAsRead(messageId)).then(function () {
                            $('body>.tooltip').remove();
                            self.renderCounter();
                            self.renderAllMessages()
                        });
                    });
                    App.showTooltip(self.jqueryNodeAllMessages, {
                        html: true
                    });
                });
            },
            showAll: function () {
                var self = this;
                self.modalCenterMessages = UI.modal.create({
                    size: 'lg',
                    titleCloseButton: false,
                    keyboardSupported: true,
                    backdropClose: true,
                    i18nUse: {
                        object: App.i18n,
                        prefix: 'text.'
                    },
                    title: App.i18n.locale('text.messages_center'),
                    content: '<div align="center">' + App.i18n.locale('text.messages_loading_text') + '</div>',
                    beforeShow: function () {
                        this.getFooter('button').text('close');
                        this.getHeader().removeClass('bg-danger').addClass('bg-info');
                        this.getFooter().addClass('hide animated slideIn')
                    }
                });

                //modal.show();
                var html = '<div>' +
                    '<div class="row">' +
                    '<div class="col-md-12">' +
                    '<div>' + App.i18n.locale('text.period') + ': ' +
                    '<div class="input-group">' +
                    '<input class="form-control filter_period_messages" readonly="readonly"/>' +
                    '<div class="input-group-btn"><button class="btn btn-primary btn-calendar"><i class="fa fa-calendar"></i></button></div>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div><br/>' +
                    '<table class="table table-overflow" style="height:380px;">' +
                    '<thead><tr><th class="width-20 text-center">&#160;</th><th class="width-180">' + App.i18n.locale('text.date') + '</th>' +
                    '<th>' + App.i18n.locale('text.message') + '</th></tr></thead>' +
                    '<tbody><tr><td colspan="2" class="width-100p text-center">' + App.i18n.locale('text.messages_loading_text') + '</td></tr></tbody>' +
                    '</table></div>';
                html = $(html);
                self.jqueryNodeAllMessages = html.find('.table tbody');
                self.jqueryNodeAllMessages.css({
                    height: '380px'
                });
                var now = moment().format('DD MMMM YYYY');
                html.find('.filter_period_messages').dateRangePicker({
                    format: 'DD MMMM YYYY',
                    startOfWeek: 'monday',
                    language: App.locale,
                    separator: ' ' + App.i18n.locale('text.to') + ' ',
                    container: html.find('.filter_period_messages').parent()
                });
                html.find('.btn-calendar').click(function (e) {
                    html.find('.filter_period_messages').data('dateRangePicker').open();
                    e.stopPropagation();
                    e.preventDefault();
                });
                html.find('.filter_period_messages').on('change, datepicker-change, datepicker-apply', function (ev, picker) {
                    self.timestamp_begin = parseInt(moment(picker.date1).startOf("day").valueOf() / 1000);
                    self.timestamp_end = parseInt(moment(picker.date2).endOf("day").valueOf() / 1000);
                    $(this).val(picker.value);
                    html.find('.filter_period_messages').data('dateRangePicker').close();
                    self.renderAllMessages();
                });
                self.modalCenterMessages.getContent().html(html);
                self.modalCenterMessages.getFooter().hide().removeClass('hide').show('slow');
                html.find('.filter_period_messages').data('dateRangePicker').setDateRange(now, now);
                html.find('.filter_period_messages').parent().find('.apply-btn').trigger('click');
            },
            renderHTML: function () {
            },
            renderFlyHTML: function () {
                var self = this;
                var no_read_messages = _.filter(self.messages, {reading: null});
                if (self.obj.length > 0) {
                    if (no_read_messages.length > 0) {
                        var li = self.obj.find('.notifications-messages li:not(li:last)');
                        if (li.length > 0) {
                            li.remove();
                        }
                        _.each(no_read_messages, function (message) {
                            //UI.log(message.datetime + ' <> ' + moment().format('X'));
                            var now = moment().format('X');
                            var diff = (message.datetime < now) ? moment(message.datetime * 1000).from(moment()) : moment(message.datetime * 1000).to(moment());
                            var html = '<li>' +
                                '<div class="dropdown-messages-box">' +
                                '<div class="media-body fs-16">' + message.text + '<br/>' +
                                '<div class="clearfix">' +
                                '<a class="pull-right text-muted no-padding no-margin" data-message-id="' + message.id + '">' +
                                '<small class="no-padding no-margin">' + App.i18n.locale('text.notification_messages_set_read') + '</small>' +
                                '</a>' +
                                '<small class="pull-left text-muted no-padding no-margin">' + diff + '</small>' +
                                '</div>' +
                                '</div>' +
                                '</div>' +
                                '</li>' +
                                '<li class="divider"></li>';
                            html = $(html);
                            html.find('a[data-device-id]').off().click(function () {
                                var a = $(this);
                                var deviceId = a.data('device-id');
                                $.when(UI.action('json.devices.one', {
                                    deviceId: deviceId
                                })).then(function () {
                                    var content = $('<div>' + App.devices.templateDeviceForm(deviceId) + '</div>');
                                    App.contentManagement.push({
                                        backListText: App.i18n.locale('text.back_to_the_list_of_devices'),
                                        contexts: {
                                            prev: {
                                                context: App.devices,
                                                content: $('.ibox-content'),
                                                renderFunctions: App.devices.render,
                                                args: [$('.ibox-content')]
                                            },
                                            new: {
                                                context: App.devices,
                                                content: content,
                                                renderFunctions: App.devices.templateDeviceFormBinds,
                                                args: [deviceId, content, {}]
                                            }
                                        }
                                    });
                                });
                            }).addClass('text-navy');
                            html.find('a[data-message-id]').off().click(function (e) {
                                var a = $(this);
                                var messageId = a.data('message-id');
                                $.when(self.setMessageAsRead(messageId)).then(function () {
                                    self.renderFlyHTML();
                                    self.renderCounter();
                                });
                                e.preventDefault();
                                e.stopPropagation();
                                //_.findWhere(self.messages, {id: parseInt(messageId)}).reading = (moment().valueOf() / 1000);
                            });
                            self.obj.find('.notifications-messages').prepend(html);
                        });
                    } else {
                        self.setNoNewMessageHTML();
                    }
                }
            },
            setNoNewMessageHTML: function () {
                var self = this;
                var li = self.obj.find('.notifications-messages li:not(li:last)');
                if (li.length > 0) {
                    li.remove();
                }
                var html = '<li>' +
                    '<div class="text-center link-block">' +
                    '<i>' + App.i18n.locale('text.notification_no_new_messages') + '</i>' +
                    '</div>' +
                    '</li>' +
                    '<li class="divider"></li>';
                self.obj.find('.notifications-messages').prepend(html);
            },
            setMessageAsRead: function (messageId) {
                return UI.action('json.notifications.read.set', {messageId: messageId});
            },
            renderCounter: function () {
                var self = this;
                var counter = self.obj.find('.count-info span');
                var no_read_messages = _.filter(self.messages, {reading: null});
                if (self.obj.length > 0 && no_read_messages.length > 0) {
                    counter.text(no_read_messages.length);
                    counter.removeClass('hide').addClass('blink');
                } else {
                    counter.text('0');
                    counter.removeClass('blink').addClass('hide');
                }
            },
        },
        devices: {
            scan: {
                decoder: null,
                intervalZoom: null,
                result: null,
                modal: function () {
                    var self = this;
                    var modal = UI.modal.alert({
                        id: 'scan-' + _.uniqueId(),
                        title: 'scan',
                        content: '<div><select id="camera-select"></select><div id="scan-canvas"><canvas width="320" height="240"></canvas></div><div id="scan-result"></div></div>',
                        afterCreate: function () {
                            var render = function () {
                                self.decoder = null;
                                var args = {
                                    //beep: 'audio/beep.mp3',                 // string, audio file location
                                    decoderWorker: '/js/plugins/DecoderWorker.js',   // string, DecoderWorker file location
                                    resultFunction: function (res) {
                                        $('#scan-result').text(res.code);
                                        self.result = res;
                                        self.decoder.stop();
                                    }
                                };
                                var canvas = $('#scan-canvas canvas');
                                self.decoder = canvas.WebCodeCamJQuery(args).data().plugin_WebCodeCamJQuery;
                                self.decoder.init();
                                self.decoder.buildSelectMenu($('#camera-select'), 0).init(args);
                                /*
                                 $('#camera-select').chosen({
                                 width: '100%',
                                 disable_search_threshold: 10
                                 });
                                 */
                                setTimeout(function () {
                                    self.decoder.play();
                                    self.intervalZoom = setInterval(function () {
                                        self.decoder.getOptimalZoom();
                                    }, 2000);
                                }, 500);
                                //decoder.buildSelectMenu('#camera-select', 0);
                                $('#camera-select').on('change', function () {
                                    UI.log($(this).val());
                                    self.decoder.stop().play();
                                    //decoder.getLastImageSrc();
                                });
                                /**/
                            };
                            if (typeof Decoder == "undefined") {
                                UI.getScripts(['/js/plugins/qrcodelib.js', '/js/plugins/webcodecamjquery.js']).done(render);
                            } else {
                                render();
                            }
                        },
                        beforeHide: function () {
                            if (self.decoder) {
                                self.decoder.stop();
                                self.decoder = null;
                                clearInterval(self.intervalZoom);
                            }
                        }
                    });
                    modal.show();
                }
            },
            templateDeviceForm: function (deviceId) {
                var self = this;
                var html = '';
                if (deviceId) {
                    var drawHTML = function (device) {
                        var deviceType = _.findWhere(App.devices.device_types, {id: parseInt(device.device_type_id)});
                        var deviceGroup = _.findWhere(App.devices.device_groups, {id: parseInt(deviceType.group_id)});
                        return '<div class="tabs-container">' +
                            '<ul class="nav nav-tabs">' +
                            '<li class="active"><a data-toggle="tab" href="#device-adjustment" data-device-id="' + device.id + '" aria-expanded="true">' + App.i18n.locale('text.general_information') + '</a></li>' +
                            (App.user.access.devices.update ?
                                    '<li class=""><a data-toggle="tab" href="#device-property" data-action="json.devices.property" data-device-id="' + device.id + '" aria-expanded="true">' + App.i18n.locale('text.device_property') + '</a></li>'
                                    :
                                    ''
                            ) +
                            '<li class=""><a data-toggle="tab" href="#device-messages" data-action="json.devices.messages" data-device-id="' + device.id + '" aria-expanded="false">' + App.i18n.locale('text.data') + '</a></li>' +
                            (App.user.access.users.update ?
                                '<li class=""><a data-toggle="tab" href="#device-management" data-action="json.devices.management" data-device-id="' + device.id + '" aria-expanded="false">' + App.i18n.locale('text.device_management') + '</a></li>'
                                :
                                '') +
                            (App.user.access.users.update ?
                                '<li class=""><a data-toggle="tab" href="#device-users" data-action="json.devices.users" data-device-id="' + device.id + '" aria-expanded="false">' + App.i18n.locale('text.binding_to_users') + '</a></li>'
                                :
                                '') +
                            (App.user.access.structures.update ?
                                '<li class=""><a data-toggle="tab" href="#device-tags" data-action="json.devices.structures" data-device-id="' + device.id + '" aria-expanded="false">' + App.i18n.locale('text.binding_to_tags') + '</a></li>'
                                :
                                '') +
                            (App.user.access.users.update ?
                                '<li class=""><a data-toggle="tab" href="#device-log" data-action="json.devices.log" data-device-id="' + device.id + '" aria-expanded="false">' + App.i18n.locale('text.device_log') + '</a></li>'
                                :
                                '') +
                            //'<li class=""><a data-toggle="tab" href="#device-events" data-action="json.devices.events" data-device-id="' + device.id + '" aria-expanded="false">Оповещения</a></li>' +
                            '</ul>' +
                            '<div class="tab-content">' +
                            '<div id="device-adjustment" class="tab-pane active">' +
                            '<div class="panel-body"><div>' +
                            (deviceType.photo_url ?
                                    '<div class="pull-right width-300"><img class="b-dashed" src="/uploads/devices_types/' + deviceType.photo_url + '" width="300"/></div>'
                                    :
                                    deviceGroup.svg.node.toString()
                            ) +
                            '<div class="pull-left" style="width:calc(100% - 320px);">' +
                            '<div class="p-h-sm">' + self.getDeviceStatusHtml(self.getDeviceStatus(device.last_active)) + '</div>' +
                            '<p class="fw-600">ID: ' + device.deviceID + '</p>' +
                            '<p class="fw-600">' + App.i18n.locale('text.device_group') + ': ' + deviceGroup.title + '</p>' +
                            '<p class="fw-600">' + App.i18n.locale('text.device_type') + ': ' + deviceType.title + '</p>' +
                            (App.user.access.devices.update ?
                                    ('<label class="controls p-h-sm">' + App.i18n.locale('text.caption') + '<input class="form-control" name="deviceTitle" value="' + UI.replaceStrings(device.title) + '"/></label>' +
                                        '<label class="controls">' + App.i18n.locale('text.desc') + '<textarea class="form-control" name="deviceDesc">' + String(device.desc ? device.desc : '') + '</textarea></label>' +
                                        '<div class="pull-left p-h-sm">' +
                                        '<button class="btn btn-primary btn-device-save" data-device-id="' + deviceId + '">' + App.i18n.locale('text.save') + '</button>' +
                                        '<button class="btn btn-outline btn-danger btn-device-remove m-l-lg">' + App.i18n.locale('text.remove') + ' ' + App.i18n.locale('text.device') + '</button>' +
                                        '</div>'
                                    )
                                    :
                                    ('<p>' + App.i18n.locale('text.caption') + ': <p class="fw-600 m-l-sm">' + device.title + '</p></p><p>' + App.i18n.locale('text.desc') + ': <p class="fw-600 m-l-sm">' + UI.lineBreaks(UI.replaceStrings(device.desc)) + '</p></p>'
                                    )
                            ) +
                            '</div></div></div>' +
                            '</div>' +
                            (App.user.access.devices.update ?
                                    '<div id="device-property" class="tab-pane"><div class="panel-body"></div></div>' : ''
                            ) +
                            (App.user.access.devices.update ?
                                    '<div id="device-log" class="tab-pane"><div class="panel-body"></div></div>' : ''
                            ) +
                            (App.user.access.devices.update ?
                                    '<div id="device-management" class="tab-pane"><div class="panel-body"></div></div>' : ''
                            ) +
                            (App.user.access.users.update ?
                                ('<div id="device-users" class="tab-pane">' +
                                    '<div class="panel-body"></div>' +
                                    '</div>')
                                :
                                '') +
                            (App.user.access.structures.update ?
                                ('<div id="device-tags" class="tab-pane">' +
                                    '<div class="panel-body"></div>' +
                                    '</div>')
                                :
                                '') +
                            '<div id="device-messages" class="tab-pane">' +
                            '<div class="panel-body"></div>' +
                            '</div>' +
                            '</div>' +
                            '</div>';
                    };
                    var device = _.findWhere(App.devices.devices, {id: parseInt(deviceId)});
                    if (!device) {
                        UI.action('json.devices.one', {deviceId: deviceId}, function (json) {
                            device = _.findWhere(json.devices.devices, {id: parseInt(deviceId)});
                            if (!device) {
                                UI.log('WRONG!!!... not a device in list [devices.templateDeviceForm]');
                                return;
                            }
                            return drawHTML(device);
                        })
                    } else {
                        return drawHTML(device);
                    }
                } else {
                    html += '<div>' +
                        '<form onsubmit="return false;">';
                    html += '<div class="btn-device-groups m-b-lg" align="center" data-toggle="buttons">';
                    _.each(App.devices.device_groups, function (group) {
                        if (!group.id) {
                            return;
                        }
                        html += '<label class="btn btn-outline btn-white width-220 m-sm p-h-xs" data-group_id="' + group.id + '">' +
                            '<input type="radio" name="deviceGroup" autocomplete="off"><i class="fa fa-fw ' + group.icon + '"></i>&#160;' + App.i18n.locale(group.i18n) + '</label>';
                    });
                    html += '</div>';
                    html += '<label class="controls m-b-md">' + App.i18n.locale('text.device_type') + ' ' + UI.select.create(App.devices.device_types, {
                            selectName: 'deviceType',
                            selectRequired: true,
                            dataFields: ['group_id'],
                            optionChoose: App.i18n.locale('text.choose_device')
                        }) + '</label>' +
                        '<table class="width-100p layout-fixed"><tr>' +
                        '<td class="device-gateway valign-top">' +
                        UI.switch.create({
                            id: 'deviceGateway',
                            text: App.i18n.locale('text.device_behind_gateway'),
                            on_off_text: [App.i18n.locale('text.no'), App.i18n.locale('text.yes')],
                        }) +
                        '<div id="deviceGatewayRow" class="no-padding hide">' +
                        //'<div class="col-md-6 no-padding p-r-md"><label class="controls">' + App.i18n.locale('text.gateway_addr') + '<input type="text" class="form-control" maxlength="255" name="gatewayID"/></label></div>' +
                        '<div class="col-md-6 no-padding p-r-md">' + App.i18n.locale('text.gateway_addr') + UI.select.create(App.devices.gateways, {
                            selectName: 'gatewayID',
                            selectRequired: true,
                            placeholder: App.i18n.locale('text.choose_device')
                        }) + '</div>' +
                        '<div class="col-md-6 no-padding p-r-md"><label class="controls">' + App.i18n.locale('text.inside_addr') + '<input type="text" class="form-control" maxlength="10" name="inside_addr" ' + (!App.devices.gateways.length ? 'disabled="disabled"' : '') + '/></label></div>' +
                        '</div></td>' +
                        '<td class="device-edit-keys valign-top">' +
                        UI.switch.create({
                            id: 'ownKeys',
                            text: App.i18n.locale('text.enter_encryption_keys'),
                            on_off_text: [App.i18n.locale('text.no'), App.i18n.locale('text.yes')],
                        }) +
                        '<div id="deviceKeysRow" class="no-padding hide">' +
                        '<div class="col-md-6 no-padding p-r-md"><label class="controls">' + App.i18n.locale('text.key_ap') + '<input name="keyAp" class="form-control" maxlength="32"/></label></div>' +
                        '<div class="col-md-6 no-padding"><label class="controls">' + App.i18n.locale('text.key_nw') + '<input name="keyNw" class="form-control" maxlength="32"/></label></div>' +
                        '</div>' +
                        '</td></tr></table>' +
                        /* ---- */
                        '<div class="device-params m-b-md hide"><hr class="no-margins"/>' +
                        '<div class="width-25p inline-block no-padding p-r-md"><label class="controls">' + App.i18n.locale('text.device_amount_inputs') + '<input type="text" name="amount_inputs" class="form-control" maxlength="3" value=""/></label></div>' +
                        '<div class="width-25p inline-block no-padding p-r-md"><label class="controls">' + App.i18n.locale('text.device_amount_outputs') + '<input type="text" name="amount_outputs" class="form-control" maxlength="3" value=""/></label></div>' +
                        '<div class="width-25p inline-block no-padding p-r-md">' + UI.switch.create({
                            id: '_232',
                            text: App.i18n.locale('text.device_232'),
                            on_off_text: [App.i18n.locale('text.no'), App.i18n.locale('text.yes')],
                            use_br: true
                        }) + '</div>' +
                        '<div class="width-25p inline-block no-padding">' + UI.switch.create({
                            id: '_485',
                            text: App.i18n.locale('text.device_485'),
                            on_off_text: [App.i18n.locale('text.no'), App.i18n.locale('text.yes')],
                            use_br: true
                        }) + '</div>' +
                        '<hr class="no-margins"/></div>' +
                        /* ---- */
                        '<label class="controls">' + App.i18n.locale('text.id_device') + '<input type="text" class="form-control" maxlength="255" name="deviceID"/>' +
                        '<i class="btn-device-scan fa-inside-input-right fa fa-fw fa-camera text-success"></i>' +
                        '</label>' +
                        '<label class="controls m-b-md">' + App.i18n.locale('text.caption') + '<input class="form-control" maxlength="200" name="deviceTitle"/></label>' +
                        '<label class="controls">' + App.i18n.locale('text.desc') + '<textarea class="form-control" maxlength="1024" name="deviceDesc"></textarea></label>' +
                        '<div class="col-md-6 m-t-sm m-b-md no-padding p-r-md">' + App.i18n.locale('text.tie_users') + ' [' + App.i18n.locale('text.chosen') + ': <span class="tie-users-amount">0</span>]<input type="hidden" name="tie-users"/>&#160;<button class="pull-right btn btn-xs btn-outline btn-info btn-ties" data-ties-for="users">...</button></div>' +
                        '<div class="col-md-6 m-t-sm m-b-md no-padding">' + App.i18n.locale('text.tie_structures') + ' [' + App.i18n.locale('text.chosen') + ': <span class="tie-structures-amount">0</span>]<input type="hidden" name="tie-structures"/>&#160;<button class="pull-right btn btn-xs btn-outline btn-info btn-ties" data-ties-for="structures">...</button></div>' +
                        '</form>' +
                        '<button class="btn btn-primary btn-device-create"><i class="fa fa-fw fa-plus"></i>&#160;' + App.i18n.locale('text.create') + '</button>' +
                        '<div class="pull-right alert alert-info" align="center">Не нашли своё устройство в списке поддерживаемого?<br/>' +
                        '<a href="https://goo.gl/forms/TbTwwsou6UgJTkB13" target="blank">Посмотрите список ближайших интеграций или оставьте заявку на добавление</a>'
                    '</div>';
                }
                return html;
            },
            actionButtons: function (device) {
                var html = '<button class="btn btn-xs btn-info btn-adjustment" data-device-id="' + device.id + '"><i class="fa fa-fw fa-cog"></i></button>';
                return html;
            },
            remove: function (deviceId, callback) {
                var self = this;
                var ga = /,/.test(deviceId);
                UI.modal.swal({
                    title: App.i18n.locale('text.confirm_action'),
                    text: ga ? App.i18n.locale('text.remove_devices_text') : App.i18n.locale('text.remove_device_text'),
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: App.i18n.locale('text.confirm_delete_button_text'),
                    cancelButtonText: App.i18n.locale('text.confirm_cancel_button_text'),
                    closeOnConfirm: false,
                    blurHideButtons: [0]
                }, function () {
                    UI.action('json.devices.remove', {deviceId: deviceId}, callback);
                    UI.modal.swal(App.i18n.locale('text.after_confirm_success_text'), App.i18n.locale('text.after_confirm_success_text2'), "success");
                });
            },
            getDeviceStatus: function (lastActive) {
                var nowLessHour = Math.floor((moment().valueOf() / 1000) - (3600 * 6));
                //UI.log(nowLessHour + ' < ' + lastActive + ' utcOff:' + moment().utcOffset());
                return lastActive > nowLessHour;
            },
            getDeviceStatusHtml: function (is, datetime) {
                return !is ?
                    '<p class="label label-danger mw-60 no-margins text-uppercase" title="' + moment(datetime * 1000).toLocaleString() + '">' + App.i18n.locale('text.offline') + '</p>'
                    :
                    '<p class="label label-primary mw-60 no-margins text-uppercase" title="' + moment(datetime * 1000).toLocaleString() + '">' + App.i18n.locale('text.online') + '</p>';
            },
            jqueryNode: null,
            templateDeviceFormBinds: function (deviceId, content, extend, callback) {
                var self = this;
                if (deviceId) {
                    clearInterval(self.messagesInterval);
                    content.find('.btn-device-save').click(function () {
                        var deviceId = $(this).data('device-id');
                        var title = content.find('[name=deviceTitle]').val();
                        var desc = content.find('[name=deviceDesc]').val();
                        UI.action('json.devices.update', {
                            deviceId: deviceId,
                            title: title,
                            desc: desc
                        }, callback);
                    });
                    content.find('.btn-device-remove').click(function () {
                        var btn = $(this);
                        self.remove(deviceId, callback);
                    });
                    content.find('.nav-tabs a[data-toggle=tab]').click(function (e) {
                        e.preventDefault();
                        var tab = $(this).tab('show');
                        //var tab = $(e.target);
                        var action = tab.data('action');
                        var deviceId = tab.data('device-id');
                        var device = _.findWhere(App.devices.devices, {id: deviceId});
                        var deviceType = _.findWhere(App.devices.device_types, {id: device.device_type_id});
                        if (action) {
                            var tBody = $('.tab-content .tab-pane.active>div:first');
                            $('body').find('.date-picker-wrapper').remove();
                            switch (action) {
                                case 'json.devices.property':
                                    tBody.html('');
                                    var sys_attr = _.filter(App.devices.attributes, function (attr) {
                                        if ($.inArray(attr.id, _.pluck(device.attributes, 'id')) === -1) {
                                            return true;
                                        }
                                    });
                                    var html = '<fieldset id="new-property"><legend>' + App.i18n.locale('text.add_new_property') + '</legend>' +
                                        '<div class="input-group">' +
                                        UI.select.create(sys_attr, {
                                            selectName: 'attribute_id',
                                            dataFields: ['type_id'],
                                            i18n: App.i18n,
                                            i18n_prefix: 'device_properties.'
                                        }) +
                                        '<input type="text" class="form-control hide" name="property_title" placeholder="' + App.i18n.locale('text.name') + '"/>' +
                                        UI.select.create(App.devices.attributes_types, {
                                            selectName: 'attribute_type',
                                            optionFieldTitle: 'type',
                                            dataFields: ['type', 'max_length', 'mask', 'event_available'],
                                            i18n: App.i18n
                                        }) +
                                        '<input type="text" class="form-control" name="property_value" disabled="disabled" placeholder="' + App.i18n.locale('text.value') + '"/>' +
                                        '<span class="input-group-btn"><button class="btn btn-primary">' + App.i18n.locale('text.add') + '</button></span>' +
                                        '</div>' +
                                        '</fieldset>';
                                    var f = $(html);
                                    var clearDataType = function (v) {
                                        if (v[0].tagName.toLowerCase() === 'select') {
                                            v.selectpicker('destroy');
                                            var n = $('<input type="text" class="form-control" name="property_value" placeholder="' + App.i18n.locale('text.value') + '"/>');
                                            v.replaceWith(n);
                                            v = n;
                                        }
                                        if (v[0].inputmask) {
                                            v[0].inputmask.remove();
                                        }
                                        if (v.data('dateRangePicker')) {
                                            v.data('dateRangePicker').destroy();
                                            v.removeAttr('readonly');
                                        }
                                        v.removeAttr('timestamp');
                                        v.removeAttr('disabled');
                                        v.val('');
                                        return v;
                                    };
                                    f.find('[name=attribute_id]').append('<option data-divider="true"></option>');
                                    f.find('[name=attribute_id]').append('<option value="0" data-content="<span class=\'label label-success\'>' + App.i18n.locale('text.attribute_user') + '</span>">' + App.i18n.locale('text.attribute_user') + '</option>');
                                    f.find('[name=attribute_id]').selectpicker({
                                        width: '300px',
                                        style: 'btn-default',
                                        showTick: true,
                                        title: App.i18n.locale('text.choose_property')
                                    }).on('changed.bs.select', function () {
                                        if (!parseInt($(this).val())) {
                                            $(this).data('system_type', 0);
                                            f.find('[name=property_title]').removeClass('hide');
                                            f.find('[name=property_title]').val('');
                                            f.find('[name=property_title]').focus();
                                            f.find('[name=attribute_type]').selectpicker('val', '');
                                            f.find('[name=attribute_type]').selectpicker('show');
                                            clearDataType(f.find('[name=property_value]'));
                                        } else {
                                            $(this).data('system_type', 1);
                                            f.find('[name=property_title]').addClass('hide');
                                            f.find('[name=attribute_type]').selectpicker('hide');
                                            var o = $(this).find('option[value=' + $(this).val() + ']');
                                            f.find('[name=property_title]').val(o.text());
                                            f.find('[name=attribute_type]').selectpicker('val', o.data('type_id'));
                                            f.find('[name=attribute_type]').trigger('change');
                                            //UI.log();
                                        }
                                    });
                                    f.find('[name=attribute_type]').selectpicker({
                                        width: '250px',
                                        style: 'btn-default',
                                        showTick: true,
                                        title: App.i18n.locale('text.type_new_property')
                                    }).selectpicker('hide').on('changed.bs.select', function (e) {
                                        var option = $(this).find('option[value=' + $(this).val() + ']');
                                        var v = clearDataType(f.find('[name=property_value]'));
                                        if (option.data('mask') !== 'null') {
                                            v.inputmask({regex: option.data('mask'), placeholder: ""});
                                        }
                                        v.attr('maxlength', option.data('max_length'));
                                        v.attr('type', option.data('type'));
                                        switch (option.data('type')) {
                                            case 'boolean':
                                                var p = v.parent();
                                                var s = $(UI.select.create([
                                                    {id: 0, title: App.i18n.locale('text.false')},
                                                    {id: 1, title: App.i18n.locale('text.true')}
                                                ], {
                                                    selectName: 'property_value'
                                                }));
                                                v.replaceWith(s);
                                                p.find('select:last').selectpicker({
                                                    width: 'auto',
                                                    style: 'btn-default',
                                                    showTick: true
                                                });
                                                v = s;
                                                break;
                                            case 'date-time':
                                                v.attr('readonly', 'readonly');
                                                v.dateRangePicker({
                                                    format: 'DD MMMM YYYY',
                                                    separator: ' ' + App.i18n.locale('text.to') + ' ',
                                                    singleDate: true,
                                                    singleMonth: true,
                                                    startOfWeek: 'monday',
                                                    language: App.locale
                                                });
                                                //v.data('dateRangePicker').open();
                                                v.on('datepicker-apply', function (ev, picker) {
                                                    $(this).val(moment(picker.date1).format('DD MMMM YYYY'));
                                                    $(this).attr('timestamp', moment(picker.date1).startOf('day').format('X'));
                                                });
                                                break;
                                            default: //string
                                                ;
                                        }
                                        v.focus();
                                    });
                                    f.find('button:last').click(function () {
                                        var t = f.find('[name=property_title]');
                                        var v = f.find('[name=property_value]');
                                        var s = f.find('[name=attribute_type]');
                                        var is_system = f.find('[name=attribute_id]').data('system_type');
                                        //var bs = html.find('.bootstrap-select');
                                        if (t.val().length < 3) {
                                            t.focus();
                                            return;
                                        }
                                        if (!s.val()) {
                                            s.selectpicker('toggle');
                                            return;
                                        }
                                        if (String(v.val()).length < 1) {
                                            v.focus();
                                            return;
                                        }
                                        var license_violation = false;
                                        if (!is_system) {
                                            var currentUserAttributes = _.filter(device.attributes, {
                                                'type_id': 4,
                                                'is_system': 0
                                            });// 4:0 - only custom vars
                                            if (App.license.level < 3 && currentUserAttributes.length < App.license.checkFunction('device_user_attributes_amount')) {
                                                license_violation = true;
                                            }
                                        }
                                        if (license_violation) {
                                            App.license.upgradeConfirm();
                                            return;
                                        } else {
                                            var data = UI.json.form(f.find(':input'));
                                            data.deviceId = device.id;
                                            UI.action('json.devices.attributes.create', data, function (json) {
                                                if (json && !json.error) {
                                                    device.attributes.push(json.attribute);
                                                    //UI.log(device);
                                                    tab.trigger('click');
                                                }
                                            });
                                        }
                                    });
                                    f.appendTo(tBody);
                                    html = '<br/><table class="table">';
                                    html += '<thead><tr>' +
                                        '<th>' + App.i18n.locale('text.name') + '</th>' +
                                        '<th>' + App.i18n.locale('text.value') + '</th>' +
                                        '</tr></thead>';
                                    html += '<tbody>';
                                    if (device.attributes.length) {
                                        _.each(device.attributes, function (attribute) {
                                            var type = _.findWhere(App.devices.attributes_types, {type: attribute.type});
                                            var a_type = (attribute.is_system ? ('<span class="label label-info">' + App.i18n.locale('text.attribute_system') + '</span>') : '<span class="label label-success">' + App.i18n.locale('text.attribute_user') + '</span>') + '&#160;&#160;&#160;';
                                            html += '<tr>' +
                                                '<td>' + App.i18n.locale('device_properties.' + attribute.title) + '<br/>' + a_type +
                                                '<span class="label label-default">' + App.i18n.locale('text.type') + ': ' + App.i18n.locale('text.' + type.type) + '</span>' +
                                                '</td>' +
                                                '<td class="width-300">' +
                                                '<div class="input-group">' +
                                                '<input class="form-control" value="' + attribute.value + '" data-attribute-id="' + attribute.id + '" data-type="' + attribute.type + '" maxlength="' + type.max_length + '"/>' +
                                                '<div class="input-group-btn">' +
                                                '<button class="btn btn-update btn-success disabled"><i class="fa fa-fw fa-save"></i></button>' +
                                                '<button class="btn btn-remove btn-danger"><i class="fa fa-fw fa-remove"></i></button>' +
                                                '</div>' +
                                                '</div>' +
                                                '</td>' +
                                                '</tr>';
                                        });
                                    } else {
                                        html += '<tr data-empty="empty"><td colspan="2" align="center">' + App.i18n.locale('text.no_data') + '</td></tr>';
                                    }
                                    html += '</tbody></table>';
                                    html = $(html);
                                    _.each(html.find('input'), function (i) {
                                        i = $(i);
                                        var attributeId = i.data('attribute-id');
                                        var cell = i.parent();
                                        var type = _.findWhere(App.devices.attributes_types, {type: i.data('type')});
                                        switch (type.type) {
                                            case 'boolean':
                                                var s = $(UI.select.create([
                                                    {id: 0, title: 'Ложь'},
                                                    {id: 1, title: 'Истина'}
                                                ], {
                                                    selectName: 'property_value',
                                                    activeItemId: i.val(),
                                                    defaultValue: i.val(),
                                                    selectType: 'boolean'
                                                }));
                                                i.replaceWith(s);
                                                cell.find('select').selectpicker({
                                                    width: 'auto',
                                                    style: 'btn-default',
                                                    showTick: true
                                                });
                                                cell.find('.bootstrap-select').data('attribute-id', attributeId);
                                                cell.find('.bootstrap-select').data('type', 'boolean');
                                                i = s;
                                                break;
                                            case 'date-time':
                                                i.attr('readonly', 'readonly');
                                                i.val(i.val() * 1000);
                                                var startDate = moment(parseInt(i.val())).format('DD MMMM YYYY');
                                                UI.log(startDate);
                                                i.dateRangePicker({
                                                    format: 'DD MMMM YYYY',
                                                    singleDate: true,
                                                    singleMonth: true,
                                                    startOfWeek: 'monday',
                                                    language: App.locale,
                                                    container: cell
                                                });
                                                i.attr('timestamp', startDate.format('X'));
                                                i.data('dateRangePicker').setStart(startDate);
                                                break;
                                            default:
                                                ;
                                        }
                                        if (type.mask) {
                                            i.inputmask({regex: type.mask, placeholder: ""});
                                        }
                                        i.on('keyup enter datepicker-apply changed.bs.select', function (e, picker) {
                                            var i = $(this);
                                            var df = i[0].defaultValue;
                                            var v = i.val();
                                            var btn_update = i.next();
                                            switch (i.data('type')) {
                                                case 'boolean':
                                                    btn_update = i.parent().next();
                                                    df = i.data('default-value');
                                                    break;
                                                case 'date-time':
                                                    var date = moment(picker.date1);
                                                    i.attr('timestamp', date.startOf('day').format('X'));
                                                    i.val(date.startOf('day').format('DD MMMM YYYY'));
                                                    v = i.attr('timestamp');
                                                    break;
                                                default:
                                                    ;
                                            }
                                            if (df != v) {
                                                btn_update.find('button:first').removeClass('disabled');
                                            } else {
                                                btn_update.find('button:first').addClass('disabled');
                                            }
                                            if (e.keyCode === 13) {
                                                btn_update.find('button:first').trigger('click');
                                            }
                                        });
                                        if (type.type === 'date-time') {
                                            cell.find('.apply-btn').trigger('click');
                                        }
                                    });
                                    html.find('.btn-update').click(function () {
                                        var btn = $(this);
                                        var i = btn.parent().prev();
                                        if (btn.hasClass('disabled')) {
                                            return;
                                        }
                                        var v = i.val();
                                        switch (i.data('type')) {
                                            case 'boolean':
                                                v = i.find('select').val();
                                                break;
                                            case 'date-time':
                                                v = i.attr('timestamp');
                                                break;
                                            default:
                                                ;
                                        }
                                        btn.addClass('disabled');
                                        UI.action('json.devices.attributes.update', {
                                            deviceId: device.id,
                                            attributeId: i.data('attribute-id'),
                                            attributeValue: v
                                        }, function () {
                                            i[0].defaultValue = v;
                                            _.findWhere(device.attributes, {id: parseInt(i.data('attribute-id'))}).value = v;
                                            tab.trigger('click');
                                        });
                                    });
                                    html.find('.btn-remove').click(function () {
                                        var btn = $(this);
                                        var i = btn.parent().prev();
                                        if (btn.hasClass('disabled')) {
                                            return;
                                        }
                                        UI.modal.swal({
                                            title: App.i18n.locale('text.confirm_action'),
                                            text: App.i18n.locale('text.remove_attribute'),
                                            type: "warning",
                                            showCancelButton: true,
                                            confirmButtonColor: "#DD6B55",
                                            confirmButtonText: App.i18n.locale('text.confirm_delete_button_text'),
                                            cancelButtonText: App.i18n.locale('text.confirm_cancel_button_text'),
                                            closeOnConfirm: false,
                                            blurHideButtons: [0, 1]
                                        }, function () {
                                            UI.action('json.devices.attributes.remove', {
                                                deviceId: device.id,
                                                attributeId: i.data('attribute-id')
                                            }, function (json) {
                                                if (json && json.result) {
                                                    device.attributes.splice(_.indexOf(device.attributes, _.findWhere(device.attributes, {id: i.data('attribute-id')})), 1);
                                                    tab.trigger('click');
                                                }
                                            });
                                            UI.modal.swal(App.i18n.locale('text.after_confirm_success_text'), App.i18n.locale('text.after_confirm_success_text2'), "success");
                                        });
                                    });
                                    html.appendTo(tBody);
                                    break;
                                case 'json.devices.structures':
                                    tBody.html('<div align="center"><i class="fa fa-fw fa-refresh fa-2x fa-spin"></i></div>');
                                    UI.action(action, {deviceId: deviceId}, function (json) {
                                        var html = $('<div><h3 class="no-margins inline-block bold fs-20">' + App.user.company_title + '</h3><div id="structures-jstree"></div>' +
                                            '<button class="to-bottom pull-right btn btn-primary btn-save"><i class="fa fa-fw fa-save"></i></button>' +
                                            '</div>'
                                        );
                                        tBody.html(html);
                                        var flat = App.structures.prepareData(json.devices.structures, json.devices.all_tags);
                                        var data = _.map(flat, function (item) {
                                            if ($.inArray(parseInt(item.id), json.devices.ties) > -1) {
                                                if (item.state) {
                                                    item.state.push({checked: true, opened: true});
                                                } else {
                                                    item.state = {
                                                        selected: true,
                                                        opened: true
                                                    }
                                                }
                                            }
                                            return item;
                                        });
                                        var jstree = html.find('#structures-jstree').jstree({
                                            core: {
                                                data: data,
                                                check_callback: true,
                                                animation: true,
                                                themes: {
                                                    icons: false
                                                }
                                            },
                                            checkbox: {
                                                keep_selected_style: false,
                                                three_state: false,
                                                cascade: 'undetermined'
                                            },
                                            plugins: ["checkbox", "sort"]
                                        });
                                        html.find('.btn-save').click(function () {
                                            var btn = $(this);
                                            if (btn.hasClass('disabled')) {
                                                return;
                                            }
                                            btn.addClass('disabled');
                                            btn.find('i').switchClass('fa-save', 'fa-refresh fa-spin');
                                            _.each(jstree.jstree(true).get_json('#', {flat: true}), function (item) {
                                                jstree.jstree(true).disable_node(item.id);
                                            });
                                            var selected = jstree.jstree(true).get_selected();
                                            var data = {
                                                deviceId: deviceId,
                                                state: App.devices.state,
                                                ties: selected.length ? _.map(selected, function (id) {
                                                    return parseInt(id);
                                                }).join(',') : ''
                                            };
                                            UI.action('json.devices.structures.tie', data).done(function (json) {
                                                if (json && json.error) {
                                                    tab.click();
                                                    return;
                                                }
                                                btn.removeClass('disabled');
                                                btn.find('i').switchClass('fa-refresh fa-spin', 'fa-save');
                                                _.each(jstree.jstree(true).get_json('#', {flat: true}), function (item) {
                                                    jstree.jstree(true).enable_node(item.id);
                                                });
                                            });
                                        });
                                    });
                                    break;
                                case 'json.devices.messages':
                                    tBody.html('');
                                    App.reports_online.init({
                                        modal: null,
                                        deviceId: deviceId,
                                        jqueryNodeList: tBody,
                                        showFilter: true
                                    }).draw();
                                    break;
                                case 'json.devices.users':
                                    tBody.html('<div align="center"><i class="fa fa-fw fa-refresh fa-2x fa-spin"></i></div>');
                                    UI.action(action, {deviceId: deviceId}, function (json) {
                                        var s = $('<div><div class="m-b-xs">' + UI.select.create(json.devices.users_ties, {
                                            selectName: 'dualListbox',
                                            multiple: true,
                                            optionFieldTitle: 'email',
                                            checkSelected: true
                                        }) + '</div><button class="pull-right btn btn-primary btn-save"><i class="fa fa-fw fa-save"></i></button></div>');
                                        tBody.html(s);
                                        tBody.find('#dualListbox').bootstrapDualListbox({
                                            nonSelectedListLabel: App.i18n.locale('text.available_for_binding'),
                                            selectedListLabel: App.i18n.locale('text.tied_users'),
                                            preserveSelectionOnMove: 'moved',
                                            moveOnSelect: false,
                                            filterPlaceHolder: App.i18n.locale('text.filter'),
                                            selectorMinimalHeight: 300,
                                            infoText: false,
                                            infoTextEmpty: App.i18n.locale('text.nothing_is_selected')
                                        });
                                        $('.form-inline .form-control').css({width: '100%'});
                                        tBody.find('.btn-save').click(function () {
                                            var btn = $(this);
                                            if (btn.hasClass('disabled')) {
                                                return;
                                            }
                                            btn.find('i').switchClass('fa-save', 'fa-refresh fa-spin');
                                            btn.addClass('disabled');
                                            var selected = s.find('#dualListbox').val() ? s.find('#dualListbox').val().join(',') : ''
                                            var data = {
                                                state: json.devices.state,
                                                deviceId: deviceId,
                                                ties: selected
                                            };
                                            UI.action('json.devices.users.tie', data).done(function (json) {
                                                if (json && !json.error) {
                                                    btn.removeClass('disabled');
                                                    btn.find('i').switchClass('fa-refresh fa-spin', 'fa-save');
                                                }
                                            });
                                        });
                                        //tBody.html(html);
                                    });
                                    break;
                                case 'json.devices.log':
                                    tBody.html('<div align="center"><i class="fa fa-fw fa-refresh fa-2x fa-spin"></i></div>');
                                    UI.action(action, {deviceId: deviceId}, function (json) {
                                        if (json && json.devices && json.devices.log) {
                                            var log = json.devices.log;
                                            if (log.length > 0) {
                                                var html = '<table class="table">';
                                                html += '<tr>' +
                                                    '<th>' + App.i18n.locale('text.datetime') + '</th>' +
                                                    '<th>' + App.i18n.locale('text.user') + '</th>' +
                                                    '<th>' + App.i18n.locale('text.real_ip') + '</th>' +
                                                    '<th class="width-20"></th>' +
                                                    '<th>' + App.i18n.locale('text.action') + '</th>' +
                                                    '</tr>';
                                                _.each(log, function (message) {
                                                    html += '<tr>' +
                                                        '<td>' + message.datetime + '</td>' +
                                                        '<td>' + message.user_title + '</td>' +
                                                        '<td>' + message.real_ip + '</td>' +
                                                        '<td>' + (message.api > 0 ? '<b class="badge badge-danger">Api</b>' : '<b class="badge badge-primary">NC</b>') + '</td>' +
                                                        '<td>' + UI.convertRouteToTitle(message.route, App.i18n) + '</td>' +
                                                        '</tr>';
                                                });
                                                html += '</table>';
                                                tBody.html($(html));
                                            } else {
                                                tBody.html('<div align="center">' + App.i18n.locale('text.no_data_log_device') + '</div>');
                                            }
                                        }
                                    });
                                    break;
                                case 'json.devices.management':
                                    tBody.html('<div align="center"><i class="fa fa-fw fa-refresh fa-2x fa-spin"></i></div>');
                                    UI.action(action, {deviceId: deviceId}, function (json) {
                                        var calibration_json = device.calibration_json ? JSON.parse(device.calibration_json || deviceType.calibration_json) : null;
                                        if (calibration_json && calibration_json.hasOwnProperty('params') && calibration_json.params.hasOwnProperty('management')) {
                                            var functions = calibration_json.params.management.hasOwnProperty('functions') ? calibration_json.params.management.functions : null;
                                            var html = '';
                                            _.each(functions, function (name) {
                                                switch (name) {
                                                    case 'power':
                                                        html += '<div><div class="m-l">' +
                                                            UI.switch.create({
                                                                id: 'device-power',
                                                                text: App.i18n.locale('text.device_status'),
                                                                on_off_text: [App.i18n.locale('text.set_off'), App.i18n.locale('text.set_on')],
                                                                checked: (json && json.hasOwnProperty('status') && json.status && json.status.hasOwnProperty('power') ? json.status.power : true)
                                                            }) + '</div>' +
                                                            '<hr/></div>';
                                                        break;
                                                    case 'limit':
                                                        html += '<div><div class="input-group">' +
                                                            '<span class="input-group-addon no-borders">' + App.i18n.locale('text.device_set_limit') + ' </span>' +
                                                            '<input class="form-control" id="device-limit" name="limit" maxlength="7" value="0"/>' +
                                                            '<span class="input-group-btn"><button class="btn btn-primary">set</button></span>' +
                                                            '</div>' +
                                                            '<hr/></div>';
                                                        break;
                                                    case 'setout':
                                                        //UI.log(json.status);
                                                        if (json && json.status && json.status.class) {
                                                            html += '<div><div class="row"><div class="col-md-3">' +
                                                                UI.select.create([
                                                                    {id: 1, title: App.i18n.locale('reports.outputs.out1')},
                                                                    {id: 2, title: App.i18n.locale('reports.outputs.out2')}
                                                                ], {
                                                                    selectName: 'setout',
                                                                    activeItemId: 1
                                                                }) + '</div><div class="col-md-3">' + UI.switch.create({
                                                                    id: 'out-power',
                                                                    use_br: false,
                                                                    text: App.i18n.locale('text.status_out'),
                                                                    on_off_text: [App.i18n.locale('text.set_off'), App.i18n.locale('text.set_on')],
                                                                    checked: (json.status.hasOwnProperty('out1') ? json.status.out1 : false)
                                                                }) + '</div><div class="col-md-6">' + App.i18n.locale('text.duration_activity_output') +
                                                                '<div class="input-group"><input class="form-control" disabled="disabled" id="duration" maxlength="3" value="0"/>' +
                                                                '<span class="input-group-btn"><button id="setout-btn" class="btn btn-primary">set</button></span>' +
                                                                '</div></div></div><hr/></div>';
                                                        } else {
                                                            html += '<b>' + App.i18n.locale('text.device_is_not_class_C') + '</b>';
                                                        }
                                                        break;
                                                    default:
                                                        ;
                                                }
                                            });
                                            html = $(html);
                                            html.find('#device-power').change(function () {
                                                var checked = $(this).is(':checked') ? 1 : 0;
                                                UI.action(action + '.cmd', {
                                                    deviceId: deviceId,
                                                    command: 'power',
                                                    value: checked
                                                });
                                            });
                                            html.find('#device-limit').inputmask({alias: "decimal", placeholder: ""}).keyup(function () {
                                                var v = $(this).val();
                                                if (v.length > 0) {
                                                    $(this).attr('limit', parseInt(v * 10));
                                                }
                                            }).parent().find('button').click(function () {
                                                var limit = html.find('#device-limit').attr('limit');
                                                if (limit) {
                                                    UI.action(action + '.cmd', {
                                                        deviceId: deviceId,
                                                        command: 'limit',
                                                        value: limit
                                                    });
                                                } else {
                                                    UI.forms.fields.setFocusError(html.find('#device-limit'), true);
                                                }
                                            });
                                            html.find('#duration').inputmask({alias: "integer", placeholder: ""});
                                            html.find('#setout').selectpicker({}).on('changed.bs.select', function () {
                                                html.find('#duration').attr('disabled', 'disabled');
                                                html.find('#out-power').prop('checked', false);
                                                if (json.status.hasOwnProperty('out' + $(this).val()) && json.status['out' + $(this).val()]) {
                                                    html.find('#out-power').prop('checked', true);
                                                }
                                            });
                                            html.find('#out-power').change(function () {
                                                var enabled = $(this).is(':checked');
                                                var out = html.find('#setout').val();
                                                if (enabled) {
                                                    html.find('#duration').removeAttr('disabled');
                                                    html.find('#duration').focus();
                                                }
                                            });
                                            html.find('#setout-btn').click(function () {
                                                //var
                                            });
                                            tBody.html(html);
                                        } else {
                                            tBody.html('<div align="center">' + App.i18n.locale('text.device_management_not_support_or_not_data_calibration') + '</div>');
                                        }
                                    });
                                    break;
                                default:
                                    UI.log('tab click');
                            }

                        }
                        //e.target // newly activated tab
                        //e.relatedTarget // previous active tab
                    });
                } else {
                    //content.find('[name=gatewayID]').inputmask({regex: "[0-9a-zA-Z:\.\/_]+", placeholder: ""});
                    content.find('[name=deviceID]').inputmask({regex: "[0-9a-zA-Z:\.\/~_]+", placeholder: ""});
                    content.find('[name=inside_addr]').inputmask({regex: "[0-9]+", placeholder: ""});
                    content.find('#deviceGateway').change(function () {
                        var is = $(this).is(':checked');
                        var row = content.find('#deviceGatewayRow').hide().removeClass('hide');
                        if (is) {
                            row.slideDown();
                        } else {
                            row.find('input').val('');
                        }
                    });
                    content.find('.btn-device-groups label').click(function (e) {
                        var btn = $(this);
                        content.find('.btn-device-groups label').removeClass('btn-primary').addClass('btn-outline btn-white');
                        btn.removeClass('btn-outline btn-white').addClass('btn-primary');
                        /* select */
                        var s = content.find('select[name=deviceType]');
                        s.parent().removeClass('hide');
                        s.val(null);
                        s.find('option').removeClass('hide');
                        s.find(':not(option[data-group_id=' + btn.data('group_id') + '])').addClass('hide');
                        s.trigger('chosen:updated');
                        var l = s.find(':not(option.hide)');
                        if (l.length === 1) {
                            s.val(l.attr('value')).trigger('chosen:updated').trigger('change');
                        } else {
                            s.trigger('chosen:open');
                            e.stopPropagation();
                        }
                        /* ---- */
                        return false;
                    });
                    content.find('.btn-ties').click(function () {
                        var btn = $(this);
                        var tiesFor = btn.data('ties-for');
                        switch (tiesFor) {
                            case 'structures':
                                var modal = UI.modal.confirm({
                                    title: App.i18n.locale('text.tie_structures'),
                                    size: 'lg',
                                    content: '<div align="center">' + App.i18n.locale('text.download_structures') + '</div>',
                                    i18nUse: {
                                        object: App.i18n,
                                        prefix: 'text.'
                                    },
                                    onOk: function () {
                                        var selected = modal.getContent('#structures-jstree').jstree("get_selected");
                                        $('.tie-structures-amount').text(selected.length);
                                        $('input[name=tie-structures]').val(selected.join(","));
                                        modal.hide();
                                    },
                                    afterCreate: function () {
                                        this.buttons.eq(0).text('choose');
                                    },
                                    afterShow: function () {
                                        modal.__state('loading');
                                        UI.action('json.devices.structures', {}, function (json) {
                                            if (!json || !json.devices || !json.devices.structures) {
                                                modal.getContent('div').html(App.i18n.locale('text.no_data'));
                                                modal.__state('free');
                                                return;
                                            }
                                            var html = $('<div><h3 class="no-margins inline-block bold fs-20">' + App.user.company_title + '</h3><div id="structures-jstree"></div></div>');
                                            modal.setContent(html);
                                            var flat = App.structures.prepareData(json.devices.structures, json.devices.all_tags);
                                            var ties = $('input[name=tie-structures]').val().split(',');
                                            //UI.log(ties);
                                            var data = _.map(flat, function (item) {
                                                if ($.inArray(item.id, ties) > -1) {
                                                    if (item.state) {
                                                        item.state.push({checked: true, opened: true});
                                                    } else {
                                                        item.state = {
                                                            selected: true,
                                                            opened: true
                                                        }
                                                    }
                                                }
                                                return item;
                                            });
                                            var jstree = html.find('#structures-jstree').jstree({
                                                core: {
                                                    data: data,
                                                    check_callback: true,
                                                    animation: true,
                                                    themes: {
                                                        icons: false
                                                    }
                                                },
                                                checkbox: {
                                                    keep_selected_style: false,
                                                    three_state: false,
                                                    cascade: 'undetermined'
                                                },
                                                plugins: ["checkbox", "sort"]
                                            });
                                            modal.__state('free');
                                            jstree.on('loaded.jstree', function () {
                                                jstree.jstree("open_all");
                                            })
                                        });
                                    }
                                });
                                modal.show();
                                break;
                            case 'users':
                                var modal = UI.modal.confirm({
                                    title: App.i18n.locale('text.tie_users'),
                                    size: 'lg',
                                    content: '<div align="center">' + App.i18n.locale('text.download_users_list') + '</div>',
                                    i18nUse: {
                                        object: App.i18n,
                                        prefix: 'text.'
                                    },
                                    onOk: function () {
                                        var selected = modal.getContent('[name=dualListbox]').val();
                                        $('.tie-users-amount').text(selected.length);
                                        $('input[name=tie-users]').val(selected.join(","));
                                        modal.hide();
                                    },
                                    afterCreate: function () {
                                        this.buttons.eq(0).text('choose');
                                    },
                                    afterShow: function () {
                                        modal.__state('loading');
                                        UI.action('json.devices.users', {}, function (json) {
                                            var ties = $('input[name=tie-users]').val().split(',');
                                            var list = _.map(json.devices.users_ties, function (item) {
                                                if ($.inArray(String(item.id), ties) > -1) {
                                                    item.selected = true;
                                                }
                                                return item;
                                            });
                                            UI.log(list);
                                            var s = '<div>' + UI.select.create(list, {
                                                selectName: 'dualListbox',
                                                multiple: true,
                                                checkSelected: true,
                                                optionFieldTitle: 'email'
                                            }) + '</div>';
                                            modal.setContent($(s));
                                            modal.getContent('[name=dualListbox]').bootstrapDualListbox({
                                                nonSelectedListLabel: 'Доступные для привязки',
                                                selectedListLabel: 'Привязанные',
                                                preserveSelectionOnMove: 'moved',
                                                moveOnSelect: false,
                                                filterPlaceHolder: 'Фильтр',
                                                selectorMinimalHeight: 300,
                                                infoText: false,
                                                infoTextEmpty: 'Ничего не выбрано'
                                            });
                                            modal.__state('free');
                                        });
                                    }
                                });
                                modal.show();
                                break;
                            default:
                                UI.log('unknown ties for...');
                        }

                    });
                    content.find('.device-params input:text').inputmask({
                        mask: '999',
                        showMaskOnFocus: false,
                        showMaskOnHover: false,
                        placeholder: ''
                    });
                    content.find('.btn-device-scan').click(function () {
                        App.devices.scan.modal();
                    });
                    content.find('select[name=gatewayID]').chosen({
                        width: '100%',
                        disable_search_threshold: 25,
                        placeholder_text_single: App.i18n.locale('text.choose_gateway')

                    });
                    content.find('select[name=deviceType]').chosen({
                        width: '100%',
                        disable_search_threshold: 25,
                        placeholder_text_single: App.i18n.locale('text.choose_device')

                    }).change(function () {
                        var v = $(this).val();
                        var deviceType = _.findWhere(App.devices.device_types, {id: parseInt(v)});
                        $('.device-params').addClass('hide');
                        if (deviceType && deviceType.id === 17) {
                            $('.device-params').removeClass('hide');
                        }
                    });
                    content.find('#ownKeys').change(function () {
                        var is = $(this).is(':checked');
                        var row = content.find('#deviceKeysRow').hide().removeClass('hide');
                        if (is) {
                            row.slideDown();
                        } else {
                            row.find('input').val('');
                        }
                    });
                    content.find('[name=deviceID]').change(function () {
                        var deviceID = $(this);
                        if (deviceID.val().length > 3 && content.find('[name=deviceTitle]').val() == '') {
                            var txt = App.i18n.locale('text.new_device');
                            if (content.find('select[name=deviceType]').val() != 'null') {
                                txt = content.find('select[name=deviceType]').find('option[value=' + content.find('select[name=deviceType]').val() + ']').text();
                            }
                            content.find('[name=deviceTitle]').val(txt + ' [' + deviceID.val() + ']');
                        }
                    });
                    content.find('.btn-device-create').click(function (e) {
                        var form = content.find('form');
                        var data = UI.json.form(form.find(':input'));
                        if (!/\d+/.test(data.deviceType)) {
                            $('#deviceType').trigger('chosen:open');
                            e.stopPropagation();
                            return;
                        }
                        if (data.deviceGateway) {
                            /*
                             if (data.gatewayID.length < 8) {
                             form.find('[name=gatewayID]').focus();
                             return;
                             }
                             */
                            if (data.inside_addr.length < 1) {
                                form.find('[name=inside_addr]').focus();
                                return;
                            }
                        }
                        if (data.deviceID.length < 8) {
                            form.find('[name=deviceID]').focus();
                            return;
                        }
                        if (data.deviceTitle.length < 5) {
                            form.find('[name=deviceTitle]').focus();
                            return;
                        }
                        //UI.log(data);
                        //return;
                        UI.action('json.devices.create', data, function (json) {
                            if (json && json.result && json.result.code == 200) {
                                self.render(self.jqueryNode);
                            } else {
                                UI.log(json);
                            }
                        });
                    });
                }
                return true;
            },
            render: function (jqueryNode, pList, search) {
                var self = this;
                self.jqueryNode = jqueryNode;
                jqueryNode.removeClass('hide');
                $.when(
                    UI.action('json.devices', {
                        pList: pList || 1,
                        search: search
                    })
                ).done(function (json) {
                    $('.nekta-help').data('section', 'devices');
                    var html = '';
                    jqueryNode.html(html);
                    html += '<div>';
                    html += '<h2 class="fw-400 p-h-xs">' + App.i18n.locale('entities.devices') + '</h2>';
                    html += '<h4 class="no-bold p-h-xs width-75p text-justify">' + App.i18n.locale('text.devices_subtitle') + '</h4>';
                    html += (App.user.access.devices.create ? '<div class="pull-left"><button class="btn btn-primary btn-device-new"><i class="fa fa-fw fa-plus"></i>&#160;' + App.i18n.locale('text.add_device') + '</button></div>' : '');
                    html += '<div class="table-list" data-for-entity="devices"><div align="center" class="table-filter pull-right">' + App.i18n.locale('text.export_displayed_data') + '<br/></div><br/><table class="table"></table></div>';
                    html += '<div class="pull-right pagination-div"></div><div class="clearfix"></div>';
                    html += '</div>';
                    html = $(html);
                    html.appendTo(jqueryNode);
                    // add pagination
                    UI.pagination.create({
                        jqueryNode: html.find('.pagination-div'),
                        rowsOnList: json.devices.rowsOnList,
                        totalRows: json.devices.totalRows,
                        activeList: json.devices.pList,
                        onclick: function () {
                            var btn = $(this);
                            var ul = btn.parents('ul');
                            if (!btn.parent().hasClass('active')) {
                                ul.find('li').removeClass('active');
                                btn.addClass('active');
                                self.pList = btn.attr('data-list');
                                jqueryNode.find('.state-loading').remove();
                                jqueryNode.prepend('<div class="state-loading pull-right"><i class="fa fa-2x fa-refresh fa-spin"></i></div>');
                                self.render(jqueryNode, self.pList, search);
                            }
                        }
                    });

                    var table = html.find('.table');
                    var columns = [], dataset = [];
                    columns.push({sClass: "hide"});
                    columns.push({title: App.i18n.locale('text.status'), sWidth: "75px", orderable: true});
                    columns.push({title: App.i18n.locale('text.caption'), sWidth: "30%", orderable: true});
                    columns.push({title: App.i18n.locale('text.type'), sWidth: "120px", orderable: true});
                    columns.push({title: App.i18n.locale('text.desc'), orderable: false});
                    var t = table.DataTable({
                        language: {
                            search: App.i18n.locale('text.search') + ":",
                            emptyTable: search ? App.i18n.locale('text.no_search_result') : App.i18n.locale('text.empty_list')
                        },
                        /*
                        processing: false,
                        serverSide: true,
                        ajax: {
                            url: "json.devices",
                            type: "POST",
                            data: function ( d ) {
                                d.pList = 2}
                        },*/
                        bAutoWidth: false,
                        dom: 'fbrtp',
                        buttons: [
                            'pdf', 'excel', 'csv'
                        ],
                        paging: false,
                        data: [],
                        columns: columns,
                        order: [[0, "desc"]],
                        createdRow: function (row, data) {
                            $(row).addClass('h-50');
                            $(row).attr('data-key-id', data[0]);
                            //
                            var device = _.findWhere(App.devices.devices, {id: data[0]});
                            var deviceType = _.findWhere(App.devices.device_types, {id: device.device_type_id});
                            var deviceGroup = _.findWhere(App.devices.device_groups, {id: deviceType.group_id});
                            var data_attributes = _.filter(device.attributes, {type_id: 2}); // type_id = 2 = Date()
                            if (data_attributes.length > 0) {
                                var now_timestamp = moment().format('X');
                                $(row).find('td:eq(1)').append('<br/><br/>');
                                _.each(data_attributes, function (attr) {
                                    //UI.log(attr);
                                    var diff = moment(attr.value * 1000).from(moment());
                                    if ((attr.value - now_timestamp) < 864000) {
                                        var html = $('<div class="m-xs" data-toggle="tooltip" data-placement="bottom" title="' + App.i18n.locale('text.attention') + '! ' + App.i18n.locale('device_properties.' + attr.title) + ': ' + diff + '">' + App.i18n.locale('device_properties.' + attr.title + '_short') + '</div>');
                                        html.addClass('label ' + App.environment['notification_' + attr.title + '_classes']);
                                        $(row).find('td:eq(1)').append(html);
                                    }
                                });
                            }
                            $(row).find('td:eq(1)').addClass('text-center');
                            $(row).find('td:eq(3)').addClass('text-center');
                            if (deviceGroup.svg_url) {
                                $(row).find('td:eq(3)').html('');
                                var svg = $('<svg width="50px" height="50px"></svg>').appendTo($(row).find('td:eq(3)'));
                                var snapObj = Snap(svg[0]);
                                var loadSVG = function (data) {
                                    var g = data.selectAll("g");
                                    deviceGroup.svg = data;
                                    snapObj.append(g);
                                    var t = Snap.matrix().scale(0.20);
                                    _.each(g, function (a) {
                                        a.group(a.selectAll("path")).transform(t);
                                    });
                                    //snapObj.append(g);
                                    //svg.html(snapObj.outerSVG());
                                };
                                Snap.load('/images/devices/' + deviceGroup.svg_url, loadSVG);
                            }
                            App.showTooltip($(row));
                        },
                        fnRowCallback: function (nRow, aData, iDisplayIndex) {
                            // Bind click event
                            $(nRow).addClass('row-full-data c-pointer');
                            $(nRow).data('device-id', aData[0]);
                            $(nRow).mouseenter(function () {
                                $(this).addClass('bg-white');
                            }).mouseleave(function () {
                                $(this).removeClass('bg-white');
                            });
                            return nRow;
                        }
                    });
                    t.buttons().container().appendTo(html.find('.table-filter', t.table().container()));
                    html.find('.dataTables_filter :input').removeClass('input-sm');
                    html.find('.dataTables_filter :input').off().keyup(function (e) {
                        var i = $(this);
                        var v = i.val();
                        if (v.length > 0 && v.length <= 1) {
                            i.focus();
                            return false;
                        }
                        if (e.keyCode === 13) {
                            self.render(jqueryNode, pList, v);
                        }
                    });
                    if (App.devices.devices.length > 0) {
                        _.each(App.devices.devices, function (device) {
                            var deviceType = _.findWhere(App.devices.device_types, {id: device.device_type_id});
                            var deviceGroup = _.findWhere(App.devices.device_groups, {id: deviceType.group_id});
                            //App.devices.devices[i].svg = deviceGroup.svg;
                            var n = Snap('#asd');
                            dataset.push([
                                device.id,
                                self.getDeviceStatusHtml(self.getDeviceStatus(device.last_active), device.last_active),
                                //('<i class="fa fa-fw ' + deviceGroup.icon + '"></i>&#160;') +
                                (device.gatewayID ? '<b class="label label-default">' + App.i18n.locale('text.gateway') + ' [' + device.gatewayID + ']</b>&#160;<b class="label label-info">' + device.inside_addr + '</b><br/>' + device.title : device.title),
                                (deviceGroup.i18n ? App.i18n.locale(deviceGroup.i18n) : ''),
                                device.desc
                                //self.actionButtons(device)
                            ]);
                        });
                        // update data
                        table.dataTable().fnClearTable();
                        table.dataTable().fnAddData(dataset);
                    }
                    if (json.request.params.search && String(json.request.params.search).length > 0) {
                        html.find('.dataTables_filter :input').val(json.request.params.search);
                    }
                    App.setGroupActions(App.user.use_group_actions);
                    /* ------------------------- */
                    // show list
                    if (App.params && App.params.id) {
                        var row = jqueryNode.find('tr[data-key-id=' + App.params.id + ']');
                        if (row.length) {
                            setTimeout(function () {
                                row.click();
                                jqueryNode.slideDown();
                            }, 1);
                        } else {
                            jqueryNode.slideDown();
                        }
                    } else {
                        jqueryNode.slideDown();
                    }

                    // device remove
                    /*
                     jqueryNode.find('.btn-device-remove').click(function () {
                     var btn = $(this);
                     self.remove(btn.attr('data-ids'));
                     });
                     */
                    // device full edit
                    jqueryNode.find('.row-full-data').click(function () {
                        var tr = $(this);
                        var deviceId = tr.data('device-id');
                        //var tr = btn.parents('tr');
                        var content = $('<div>' + self.templateDeviceForm(deviceId) + '</div>');
                        $('.tooltip').remove();
                        App.contentManagement.push({
                            backListText: App.i18n.locale('text.back_to_the_list_of_devices'),
                            contexts: {
                                prev: {
                                    context: self,
                                    content: self.jqueryNode,
                                    renderFunctions: self.render,
                                    args: [jqueryNode, pList, search]
                                },
                                new: {
                                    context: self,
                                    content: content,
                                    renderFunctions: self.templateDeviceFormBinds,
                                    args: [deviceId, content, {}]
                                }
                            }
                        });
                        /*
                         App.contentManagement.push({
                         prevNode: jqueryNode.find('div:first'),
                         newNode: content,
                         backListText: App.i18n.locale('text.back_to_the_list_of_devices'),
                         clickToBack: function () {
                         self.render(jqueryNode, pList, search);
                         }
                         });
                         self.templateDeviceFormBinds(deviceId, content);*/
                    });
                    // ##############
                    html.find('.btn-device-new').click(function () {
                        var btn = $(this);
                        var content = $(self.templateDeviceForm());
                        App.contentManagement.push({
                            backListText: App.i18n.locale('text.back_to_the_list_of_devices'),
                            contexts: {
                                prev: {
                                    context: self,
                                    content: self.jqueryNode,
                                    renderFunctions: self.render,
                                    args: [jqueryNode, pList, search]
                                },
                                new: {
                                    context: self,
                                    content: content,
                                    renderFunctions: self.templateDeviceFormBinds,
                                    args: [null, content, {}]
                                }
                            }
                        });
                        /*
                         App.contentManagement.push({
                         prevNode: jqueryNode.find('div:first'),
                         newNode: $(self.templateDeviceForm()),
                         backListText: App.i18n.locale('text.back_to_the_list_of_devices'),
                         clickToBack: function () {
                         self.render(jqueryNode, pList, search);
                         },
                         afterTransition: function () {
                         var content = this.newNode;
                         self.templateDeviceFormBinds(null, content);
                         }
                         });
                         */
                    });
                });
            }
        },
        events: {
            types: [
                {id: 'none'},
                {id: 'voice', mask: '+7 (999) 999-99-99', maxlength: 18, placeholder: ''},
                {id: 'sms', mask: '+7 (999) 999-99-99', maxlength: 18, placeholder: ''},
                {id: 'email', mask: 'email', maxlength: 255, placeholder: ''},
                {id: 'get', maxlength: 300, placeholder: ''}
            ],
            on_completion: [
                {id: 'preserve'},
                {id: 'not_preserve'},
                {id: 'disabled'}
            ],
            render: function (jqueryNode, pList, search) {
                var self = this;
                //UI.log(self);
                //return;
                $.when(
                    UI.action('json.events', {pList: pList || 1})
                ).then(function (json) {
                    $.extend(self, {
                        jqueryNode: jqueryNode
                    });
                    self.renderHTML(json.events);
                    return this;
                });
            },
            renderHTML: function (response) {
                var self = this;
                self.jqueryNode.html('in review...');
                return;
                //UI.log(response);
                //$('.nekta-help').data('section', 'events');
                var html = '';
                self.jqueryNode.html(html);
                html += '<div>';
                html += '<h2 class="fw-400 p-h-xs">' + App.i18n.locale('entities.events') + '</h2>';
                html += '<h4 class="no-bold p-h-xs width-75p text-justify">' + App.i18n.locale('text.events_subtitle') + '</h4>';
                html += (App.user.access.events.create ? '<div class="pull-left"><button class="btn btn-primary btn-event-new"><i class="fa fa-fw fa-plus"></i>&#160;' + App.i18n.locale('text.add_event') + '</button></div>' : '');
                html += '<div class="table-list" data-for-entity="events"><div align="center" class="table-filter pull-right">' + App.i18n.locale('text.export_displayed_data') + '<br/></div><br/><table class="table"></table></div>';
                html += '<div class="pull-right pagination-div"></div><div class="clearfix"></div>';
                html += '</div>';
                html = $(html);
                html.appendTo(self.jqueryNode);

                //  fill table
                var table = html.find('.table');
                var columns = [], dataset = [];
                columns.push({sClass: "hide"});
                columns.push({title: App.i18n.locale('text.status'), sWidth: "75px", orderable: true});
                columns.push({title: App.i18n.locale('text.caption'), sWidth: "220px", orderable: true});
                columns.push({title: App.i18n.locale('text.condition'), orderable: false});
                columns.push({title: App.i18n.locale('text.trigger'), orderable: false});
                columns.push({title: App.i18n.locale('text.notification'), orderable: false});
                var t = table.DataTable({
                    language: {
                        search: App.i18n.locale('text.search') + ":",
                        emptyTable: self.search ? App.i18n.locale('text.no_search_result') : App.i18n.locale('text.empty_list')
                    },
                    bAutoWidth: false,
                    dom: 'fbrtp',
                    buttons: [
                        'pdf', 'excel', 'csv'
                    ],
                    paging: false,
                    data: [],
                    columns: columns,
                    order: [[0, "desc"]],
                    createdRow: function (row, data) {
                        $(row).addClass('h-50');
                        $(row).attr('data-key-id', data[0]);
                        $(row).find('td:eq(1)').addClass('text-center');
                        //UI.log($(row).find('td:eq(3)'));
                        //$(row).find('td:eq(3), td:eq(4)').addClass('text-center');
                    },
                    fnRowCallback: function (nRow, aData, iDisplayIndex) {
                        // Bind click event
                        $(nRow).addClass('row-event-edit c-pointer');
                        $(nRow).mouseenter(function () {
                            $(this).addClass('bg-white');
                        }).mouseleave(function () {
                            $(this).removeClass('bg-white');
                        });
                        return nRow;
                    }
                });
                t.buttons().container().appendTo(html.find('.table-filter', t.table().container()));
                html.find('.dataTables_filter :input').removeClass('input-sm');
                html.find('.dataTables_filter :input').off().keyup(function (e) {
                    var i = $(this);
                    var v = i.val();
                    if (v.length > 0 && v.length <= 1) {
                        i.focus();
                        return false;
                    }
                    if (e.keyCode === 13) {
                        self.render(self.jqueryNode, self.pList, v);
                    }
                });
                if (response.events.length > 0) {
                    _.each(response.events, function (event) {
                        event.params = JSON.parse(event.params);
                        //UI.log(_.findWhere(response.devices, {id: parseInt(event.params.device.id)}));
                        $.extend(event.params.device, _.findWhere(response.devices, {id: parseInt(event.params.device.id)}));
                        var device = event.params.device;
                        device.type = {};
                        device.labels = {};
                        $.extend(device.type, _.findWhere(response.device_types, {id: parseInt(device.device_type_id)}));
                        //UI.log(response);
                        var calibration = device.calibration_json = JSON.parse(device.calibration_json || device.type.calibration_json);
                        var report_online_settings = event.params.device.report_online_settings = JSON.parse(event.params.device.report_online_settings || event.params.device.type.report_online_settings);
                        var trigger = event.params.trigger;
                        //
                        if (calibration.params.hasOwnProperty('events') && calibration.params.events && calibration.params.events.hasOwnProperty('branches')) {
                            var labels = {};
                            _.each(calibration.params.events.branches, function (branch) {
                                if (!labels.hasOwnProperty(branch)) {
                                    labels = {};
                                }
                                _.each(report_online_settings.available.fields, function (field, i) {
                                    labels[branch][field] = (report_online_settings.available.hasOwnProperty('labels') && report_online_settings.available.labels[i]) ?
                                        report_online_settings.available.labels[i]
                                        :
                                        App.i18n.locale('reports.' + field);
                                });
                            });
                            device.labels = labels;
                        }
                        if (trigger) {
                            $.extend(trigger, _.findWhere(response.devices, {id: parseInt(trigger.id)}));
                            trigger.type = {};
                            trigger.labels = {};
                            $.extend(trigger.type, _.findWhere(response.device_types, {id: parseInt(trigger.device_type_id)}));
                            var calibration = trigger.calibration = JSON.parse(trigger.calibration_json || trigger.type.calibration_json);
                            if (calibration.params.hasOwnProperty('events') && calibration.params.events.hasOwnProperty('branches')) {
                                var labels = {};
                                _.each(calibration.params.events.branches, function (branch) {
                                    if (!labels.hasOwnProperty(branch)) {
                                        labels[branch] = {};
                                    }
                                    _.each(report_online_settings.available.fields, function (field, i) {
                                        labels[branch][field] = (report_online_settings.available[branch].hasOwnProperty('labels') && report_online_settings.available[branch].labels[i]) ?
                                            report_online_settings.available.labels[i]
                                            :
                                            App.i18n.locale('reports.' + field);
                                    });
                                });
                                trigger.labels = labels;
                            }
                        }
                        var notification = {};
                        if (event.params.notification) {
                            switch (event.params.notification.type) {
                                case 'voice':
                                    notification.data = '<div>Тип: <div class="label label-info">' + App.i18n.locale('text.event_notification_' + event.params.notification.type) + '</div><br/>' +
                                        'Получатель: <span>' + event.params.notification.recipient + '</span><br/>' +
                                        'Сообщение: <span>' + event.params.notification.recipientText + '</span>' +
                                        '</div>';
                                    break;
                                case 'sms':
                                    notification.data = '<div>Тип: <span class="label label-info">' + App.i18n.locale('text.event_notification_' + event.params.notification.type) + '</span><br/>' +
                                        'Получатель: <span>' + event.params.notification.recipient + '</span><br/>' +
                                        'Сообщение: <span>' + event.params.notification.recipientText + '</span>' +
                                        '</div>';
                                    break;
                                case 'email':
                                    notification.data = '<div>Тип: <span class="label label-info">' + App.i18n.locale('text.event_notification_' + event.params.notification.type) + '</span><br/>' +
                                        'Получатель: <span>' + event.params.notification.recipient + '</span><br/>' +
                                        'Сообщение: <span>' + event.params.notification.recipientText + '</span>' +
                                        '</div>';
                                    break;
                                case 'get':
                                    notification.data = '<div>Тип: <span class="label label-info">' + App.i18n.locale('text.event_notification_' + event.params.notification.type) + '</span><br/>' +
                                        'Получатель: <span>' + event.params.notification.recipient + '</span><br/>' +
                                        'Сообщение: <span>' + event.params.notification.recipientText + '</span>' +
                                        '</div>';
                                    break;
                                default:
                                    notification = false;
                            }
                        }
                        dataset.push([
                            event.id,
                            (event.status ? '<i class="fa fa-fw fa-2x fa-refresh"></i>' : '<i class="fa fa-fw fa-2x fa-pause-circle"></i>'),
                            event.title,
                            ('<b class="label label-default">' + device.title + '</b><br/>' + self.decodeExpressionString(device.expression, false, device.labels)),
                            (trigger ? ('<b class="label label-default">' + device.title + '</b><br/>' + self.decodeExpressionString(trigger.expression, false, trigger.labels)) : App.i18n.locale('text.no')),
                            (notification ? notification.data : App.i18n.locale('text.no'))
                        ]);
                    });
                    // update data
                    table.dataTable().fnClearTable();
                    table.dataTable().fnAddData(dataset);
                }
                if (self.search && String(self.search).length > 0) {
                    html.find('.dataTables_filter :input').val(self.search);
                }
                // show list
                if (App.params && App.params.id) {
                    var row = self.jqueryNode.find('tr[data-key-id=' + App.params.id + ']');
                    if (row.length) {
                        setTimeout(function () {
                            row.click();
                            self.jqueryNode.slideDown();
                        }, 100);
                    } else {
                        self.jqueryNode.slideDown();
                    }
                } else {
                    self.jqueryNode.slideDown();
                }
                // bind events
                html.find('.btn-event-new, .row-event-edit').click(function () {
                    var btn = $(this);
                    var eventId = parseInt(btn.data('key-id'));
                    var content = self.templateFormHTML(_.findWhere(response.events, {id: eventId}));
                    App.contentManagement.push({
                        backListText: App.i18n.locale('text.back_to_the_list_of_events'),
                        contexts: {
                            prev: {
                                context: self,
                                content: self.jqueryNode,
                                renderFunctions: self.render,
                                args: [self.jqueryNode, self.pList, self.search]
                            },
                            new: {
                                context: self,
                                content: content,
                                renderFunctions: null,
                                args: null
                            }
                        }
                    });
                    /*
                     App.contentManagement.push({
                     prevNode: self.jqueryNode.find('div:first'),
                     newNode: content,
                     backListText: App.i18n.locale('text.back_to_the_list_of_events'),
                     clickToBack: function () {
                     self.render(self.jqueryNode, self.pList, self.search);
                     }
                     });
                     */
                });
            },
            templateFormHTML: function (event) {
                var self = this;
                //UI.log(event);
                var devices = App.events.devices;
                var devices_triggered = _.filter(devices, function (device) {
                    var type = _.findWhere(App.events.device_types, {id: parseInt(device.device_type_id)});
                    if (type && type.hasOwnProperty('allow_trigger') && type.allow_trigger) {
                        return true;
                    }
                    return false;
                });
                var html = '<div></div>';
                html = $(html);
                _.each(self.types, function (item, i) {
                    self.types[i].title = App.i18n.locale('text.event_notification_' + item.id);
                });
                _.each(self.on_completion, function (item, i) {
                    self.on_completion[i].title = App.i18n.locale('text.event_on_completion_' + item.id);
                });
                UI.pageControl.create({
                    name: 'newEvent',
                    minHeight: '100%',
                    jqueryNode: html,
                    tabNames: [
                        App.i18n.locale('text.general_information'),
                        App.i18n.locale('text.event_device'),
                        App.i18n.locale('text.event_trigger'),
                        App.i18n.locale('text.event_notification'),
                        App.i18n.locale('text.event_settings')
                    ],
                    tabContents: [
                        (
                            '<div>' +
                            '<label class="controls">' + App.i18n.locale('text.name') + '<input name="eventName" class="form-control" value="' + (event && event.title ? event.title : '') + '"/></label>' +
                            '<label class="controls">' + App.i18n.locale('text.desc') + '<textarea name="eventDesc" class="form-control">' + (event && event.desc ? event.desc : '') + '</textarea></label>' +
                            '<hr/><div class=""><button class="pull-right btn btn-info btn-next">' + App.i18n.locale('text.next_step') + '&#160;<i class="fa fa-fw fa-angle-double-right"></i></button></div>' +
                            '</div>'
                        ),
                        (
                            '<div>' +
                            '<label class="controls">' + App.i18n.locale('text.choose_device') +
                            UI.select.create(devices, {
                                selectName: 'eventDevice',
                                optionChoose: App.i18n.locale('text.choose_device'),
                                dataFields: ['device_type_id']
                            }) + '</label>' +
                            '<input type="hidden" name="eventDeviceExpression" value="' + (event && event.params.device && event.params.device.expression ? event.params.device.expression : '') + '"/>' +
                            '<div id="eventDeviceExpressions" class="m-b-md">' +
                            '<div class="exp-v" align="center"></div>' +
                            '<div class="exp-s m-t-sm" align="center">' + App.i18n.locale('events.requirement_not_set') + '</div>' +
                            '</div>' +
                            '<hr/><div class="">' +
                            '<button class="pull-left btn btn-info btn-prev"><i class="fa fa-fw fa-angle-double-left"></i>&#160;' + App.i18n.locale('text.prev_step') + '</button>' +
                            '<button class="pull-right btn btn-info btn-next">' + App.i18n.locale('text.next_step') + '&#160;<i class="fa fa-fw fa-angle-double-right"></i></button>' +
                            '</div>' +
                            '</div>'
                        ),
                        (
                            '<div>' +
                            '<label class="controls">' +
                            UI.switch.create({
                                id: 'triggerAllowed',
                                text: App.i18n.locale('text.when_triggered_set_trigger'),
                                on_off_text: [App.i18n.locale('text.no'), App.i18n.locale('text.yes')],
                                checked: (event && event.params.trigger) ? true : false
                            }) +
                            '</label>' +
                            '<div id="when_triggered_set_trigger" class="' + ((event && event.params.trigger) ? '' : 'hide') + '">' +
                            '<label class="controls">' + App.i18n.locale('text.choose_device') +
                            UI.select.create(devices_triggered, {
                                selectName: 'eventTriggerDevice',
                                optionChoose: App.i18n.locale('text.choose_device'),
                                dataFields: ['device_type_id']
                            }) + '</label>' +
                            '<input type="hidden" name="eventTriggerExpression" value="' + (event && event.params.trigger ? event.params.trigger.expression : '') + '"/>' +
                            '<div id="eventTriggerExpressions" class="m-b-md">' +
                            '<div class="exp-v" align="center"></div>' +
                            '<div class="exp-s m-t-sm" align="center">' + App.i18n.locale('events.requirement_not_set') + '</div>' +
                            '</div>' +
                            '</div>' +
                            '<hr/><div>' +
                            '<button class="pull-left btn btn-info btn-prev"><i class="fa fa-fw fa-angle-double-left"></i>&#160;' + App.i18n.locale('text.prev_step') + '</button>' +
                            '<button class="pull-right btn btn-info btn-next">' + App.i18n.locale('text.next_step') + '&#160;<i class="fa fa-fw fa-angle-double-right"></i></button>' +
                            '</div>' +
                            '</div>'

                        ),
                        (
                            '<div>' +
                            '<label class="controls">' +
                            UI.select.create(self.types, {
                                selectName: 'notification_type'
                            })
                            + '</label><div id="eventNotification" class="hide">' +
                            '<label class="controls"><span>' + App.i18n.locale('text.recipient') + '</span><input class="form-control" name="recipient" value="' + (event && event.params.notification && event.params.notification.recipient ? event.params.notification.recipient : '') + '"/></label>' +
                            '<label class="controls"><span>' + App.i18n.locale('text.recipientText') + ':</span><textarea class="form-control" name="recipientText">' + (event && event.params.notification && event.params.notification.recipientText ? event.params.notification.recipientText : '') + '</textarea></label>' +
                            '</div><hr/><div>' +
                            '<button class="pull-left btn btn-info btn-prev"><i class="fa fa-fw fa-angle-double-left"></i>&#160;' + App.i18n.locale('text.prev_step') + '</button>' +
                            '<button class="pull-right btn btn-info btn-next">' + App.i18n.locale('text.next_step') + '&#160;<i class="fa fa-fw fa-angle-double-right"></i></button>' +
                            '</div></div>'
                        ),
                        (
                            '<div>' +
                            '<label class="controls">' + App.i18n.locale('text.event_on_completion') + ':' +
                            UI.select.create(self.on_completion, {
                                selectName: 'on_completion'
                            })
                            + '</label>' +
                            '<hr/><div>' +
                            '<button class="pull-left btn btn-info btn-prev"><i class="fa fa-fw fa-angle-double-left"></i>&#160;' + App.i18n.locale('text.prev_step') + '</button>' +
                            (event ?
                                    '<button class="pull-right btn btn-primary btn-event-update" data-event-id="' + event.id + '"><i class="fa fa-fw fa-save"></i>&#160;' + App.i18n.locale('text.save') + '</button>' +
                                    '<button class="pull-right m-r-sm btn btn-outline btn-danger btn-event-remove" data-event-id="' + event.id + '"><i class="fa fa-fw fa-minus"></i>&#160;' + App.i18n.locale('text.remove') + '</button>'
                                    :
                                    '<button class="pull-right btn btn-primary btn-event-create"><i class="fa fa-fw fa-plus"></i>&#160;' + App.i18n.locale('text.create') + '</button>'
                            ) +
                            '</div>' +
                            '</div>'
                        )
                    ],
                    tabEvents: [
                        // tab 0
                        function (e, activeTab) {
                            //var pc = this;
                            setTimeout(function () {
                                activeTab.content.find('input:eq(0)').focus();
                            }, 400);
                        },
                        // tab 1
                        function (e, activeTab) {
                            var pc = this;
                            $(activeTab.content.find('[name=eventDevice]').chosen({
                                width: '100%',
                                disable_search_threshold: 25
                            }));
                        },
                        // tab 2
                        function (e, activeTab) {
                            var pc = this;
                            var tabBody = activeTab.content;
                            var select = $(tabBody.find('[name=eventTriggerDevice]').chosen({
                                width: '100%',
                                disable_search_threshold: 25
                            }));
                            if (!activeTab.binds) {
                                pc.loadingShow();
                                tabBody.find('#triggerAllowed').click(function () {
                                    var triggerAllowed = tabBody.find('#when_triggered_set_trigger');
                                    var is = $(this).is(':checked');
                                    triggerAllowed.hide().removeClass('hide');
                                    if (is) {
                                        triggerAllowed.slideDown();
                                    } else {
                                        triggerAllowed.slideUp();
                                        select.val('null');
                                    }
                                });
                                activeTab.binds = true;
                            }
                            pc.loadingHide();
                        },
                        function (e, activeTab) {
                            var pc = this;
                            var tabBody = activeTab.content;
                            $(tabBody.find('[name=notification_type]').chosen({
                                width: '100%',
                                disable_search_threshold: 25
                            }));
                        },
                        function (e, activeTab) {
                            var pc = this;
                            var tabBody = activeTab.content;
                            tabBody.find('[name=on_completion]').chosen({
                                width: '100%',
                                disable_search_threshold: 25
                            });
                        }
                    ],
                    afterCreate: function () {
                        var pc = this;
                        pc.loadingHide();
                        // set Tab 1
                        var select = pc.obj.find('[name=eventDevice]');
                        select.on('change', function () {
                            var select = $(this);
                            //UI.log('eventDevice change ...' + select.val());
                            var edr = pc.obj.find('#eventDeviceExpressions');
                            var ev = edr.find('.exp-v');
                            var es = edr.find('.exp-s');
                            var edr_data = pc.obj.find('[name=eventDeviceExpression]');
                            if (select.val() == 'null') {
                                edr.slideUp();
                                return;
                            }
                            if (event && select.val() != event.params.device.id) {
                                edr_data.val('');
                            }
                            edr.hide();
                            var defText = '<b>' + App.i18n.locale('events.requirement_not_set') + '</b>';
                            es.html('');
                            var device_type_id = select.find('option[value=' + select.val() + ']').data('device_type_id');
                            var device = _.findWhere(App.events.devices, {id: parseInt(select.val())});
                            device.labels = {};
                            var deviceType = _.findWhere(App.events.device_types, {id: parseInt(device_type_id)});
                            if (!deviceType.calibration_json) {
                                ev.html('');
                                es.html($('<div class="text-center">' + App.i18n.locale('text.device_is_gateway') + '</div>'));
                                edr.slideDown();
                            } else {
                                var calibrations = JSON.parse(device.calibration_json || deviceType.calibration_json);
                                var report_online_settings = JSON.parse(device.report_online_settings || deviceType.report_online_settings);
                                if (calibrations.params.hasOwnProperty('events') && calibrations.params.events.hasOwnProperty('branches')) {
                                    _.each(calibrations.params.events.branches, function (branch) {
                                        if (!device.labels.hasOwnProperty(branch)) {
                                            device.labels = {};
                                        }
                                        _.each(report_online_settings.available.fields, function (field, i) {
                                            device.labels[field] = (App.i18n.exists('reports._' + deviceType.deviceTypeID + '.' + field) ?
                                                    App.i18n.locale('reports._' + deviceType.deviceTypeID + '.' + field)
                                                    :
                                                    App.i18n.locale('reports.' + field)
                                            );
                                        });
                                    });
                                }
                                //UI.log(device.labels);
                                var html = '<div class="expression-part" align="center">';
                                _.each(device.labels, function (branch, branchName) {
                                    _.each(branch, function (v, n) {
                                        //UI.log(arguments);
                                        html += '<div class="expression-input p-xs inline-block" align="center">';
                                        html += '<b class="">' + v + '</b><div class="input-group">';
                                        html += '<select class="form-control width-75"><option value="=">=</option><option value="&lt;">&lt;</option><option value="&gt;">&gt;</option></select>';
                                        html += '<input name="' + branchName + '.' + n + '" value="" class="form-control width-120 inline-block" placeholder="' + App.i18n.locale('text.value') + '" maxlength="10"></div>';
                                        html += '</div>';
                                    });
                                });
                                html += '<br/><button class="btn btn-primary btn-add-expression">' + App.i18n.locale('text.add_condition') + '</button></div>';
                                html = $(html);
                                html.find('input').inputmask({regex: "[0-9\.]+", placeholder: ""});
                                html.find('.btn-add-expression').click(function () {
                                    var expressionInputs = html.find('.expression-input input').filter(function () {
                                        return $(this).val() != "";
                                    });
                                    if (expressionInputs.length) {
                                        var expression = self.encodeExpressionString(expressionInputs, edr_data.val());
                                        expressionInputs.val('');
                                        html.find('.expression-input select').val('=');
                                        edr_data.val(expression);
                                        es.html('<div class="width-75p border-top-bottom border-left-right border-size-md fs-20">' + self.decodeExpressionString(expression, false, device.labels) + '</div>');
                                    } else {
                                        html.find('.expression-input input').eq(0).focus();
                                    }
                                });
                                ev.html(html);
                                var text = self.decodeExpressionString(edr_data.val(), false, device.labels);
                                es.html('<div class="width-75p border-top-bottom border-left-right border-size-md fs-20">' + (text ? text : defText) + '</div>');
                                edr.slideDown();
                            }
                        });
                        if (event && event.params.device) {
                            select.val(event.params.device.id);
                            select.trigger('chosen:updated');
                            select.trigger('change');
                        }
                        //set Tab 2
                        var select = pc.obj.find('[name=eventTriggerDevice]');
                        select.on('change', function () {
                            var select = $(this);
                            //UI.log('eventTriggerDevice change ...' + select.val());
                            var edr = pc.obj.find('#eventTriggerExpressions');
                            var ev = edr.find('.exp-v');
                            var es = edr.find('.exp-s');
                            var edr_data = pc.obj.find('[name=eventTriggerExpression]');
                            if (select.val() == 'null') {
                                edr.slideUp();
                                return;
                            }
                            if (event && event.trigger && select.val() != event.trigger.id) {
                                edr_data.val('');
                            }
                            edr.hide();
                            var defText = '<b>' + App.i18n.locale('events.requirement_not_set') + '</b>';
                            es.html('');
                            var trigger = {};
                            trigger.device = _.findWhere(App.events.devices, {id: parseInt(select.val())});
                            trigger.value = (event && event.params.trigger && event.params.trigger.expression ? event.params.trigger.expression : '');
                            trigger.type = _.findWhere(App.events.device_types, {id: trigger.device.device_type_id});
                            if (!trigger.type.calibration_json) {
                                ev.html('');
                                es.html($('<div class="text-center">' + App.i18n.locale('text.device_is_gateway') + '</div>'));
                                edr.slideDown();
                            } else {
                                var calibrations = JSON.parse(trigger.device.calibration_json || trigger.type.calibration_json);
                                var report_online_settings = JSON.parse(trigger.device.report_online_settings || trigger.type.report_online_settings);
                                trigger.labels = {};
                                if (calibrations.params.hasOwnProperty('events') && calibrations.params.events.hasOwnProperty('branches')) {
                                    _.each(calibrations.params.events.branches, function (branch) {
                                        if (!trigger.labels.hasOwnProperty(branch)) {
                                            trigger.labels[branch] = {};
                                        }
                                        _.each(report_online_settings.available[branch].fields, function (field, i) {
                                            trigger.labels[branch][field] = (report_online_settings.available[branch].hasOwnProperty('labels') && report_online_settings.available[branch].labels[i]) ?
                                                report_online_settings.available[branch].labels[i]
                                                :
                                                App.i18n.locale('reports.' + branch + '.' + field);
                                        });
                                    });
                                }
                                var html = '<div class="expression-part" align="center">';
                                _.each(trigger.labels, function (branch, branchName) {
                                    _.each(branch, function (v, n) {
                                        //UI.log(arguments);
                                        html += '<div class="expression-input p-xs inline-block" align="center">';
                                        html += '<b class="">' + v + '</b><div class="input-group">';
                                        html += '<select class="form-control width-75"><option value="=">=</option><option value="&lt;">&lt;</option><option value="&gt;">&gt;</option></select>';
                                        html += '<input name="' + branchName + '.' + n + '" value="" class="form-control width-120 inline-block" placeholder="' + App.i18n.locale('text.value') + '" maxlength="10"></div>';
                                        html += '</div>';
                                    });
                                });
                                html += '<br/><button class="btn btn-primary btn-add-expression">' + App.i18n.locale('text.add_condition') + '</button></div>';
                                html = $(html);
                                html.find('.btn-add-expression').click(function () {
                                    var expressionInputs = html.find('.expression-input input').filter(function () {
                                        return $(this).val() != "";
                                    });
                                    if (expressionInputs.length) {
                                        var expression = self.encodeExpressionString(expressionInputs, edr_data.val());
                                        expressionInputs.val('');
                                        html.find('.expression-input select').val('=');
                                        edr_data.val(expression);
                                        es.html('<div class="width-75p border-top-bottom border-left-right border-size-md fs-20">' + self.decodeExpressionString(expression, false, trigger.labels) + '</div>');
                                    } else {
                                        html.find('.expression-input input').eq(0).focus();
                                    }
                                });
                                ev.html(html);
                                var text = self.decodeExpressionString(edr_data.val(), false, trigger.labels);
                                es.html('<div class="width-75p border-top-bottom border-left-right border-size-md fs-20">' + (text ? text : defText) + '</div>');
                                edr.slideDown();
                            }
                        });
                        if (event && event.params.trigger) {
                            select.val(event.params.trigger.id);
                            select.trigger('chosen:updated');
                            select.trigger('change');
                        }
                        // set Tab 3
                        var select = pc.obj.find('[name=notification_type]');
                        select.on('change', function () {
                            var select = $(this);
                            pc.obj.find('#eventNotification').hide().removeClass('hide');
                            var type = _.findWhere(self.types, {id: select.val()}),
                                recipient = pc.obj.find('[name=recipient]'),
                                recipientText = pc.obj.find('[name=recipientText]');
                            recipient.val('');
                            recipientText.val('');
                            switch (type.id) {
                                case 'none':
                                    pc.obj.find('#eventNotification').slideUp();
                                    break;
                                default:
                                    recipient.parent('label').find('span').text(App.i18n.locale(type.title));
                                    recipient.inputmask(type.mask, {placeholder: type.placeholder});
                                    pc.obj.find('#eventNotification').slideDown();
                            }
                        });
                        if (event) {
                            select.val(event.params.notification.type);
                            select.trigger('chosen:updated');
                            select.trigger('change');
                            pc.obj.find('[name=recipient]').val(event.params.notification.recipient);
                            pc.obj.find('[name=recipientText]').val(event.params.notification.recipientText);
                        }
                        pc.obj.find('.btn-prev').click(function () {
                            pc.prevTab();
                        });
                        pc.obj.find('.btn-next').click(function () {
                            pc.nextTab();
                        });
                        // set Tab 4
                        if (event) {
                            pc.obj.find('[name=on_completion] option[value=' + event.params.settings.on_completion + ']').prop('selected', 'selected');
                            pc.obj.find('[name=on_completion]').trigger('chosen:updated');
                        }
                        // remove event;
                        pc.obj.find('.btn-event-remove').click(function () {
                            var btn = $(this);
                            var eventId = btn.data('event-id');
                            UI.action('json.events.remove', {eventId: eventId}, function () {
                                self.render(self.jqueryNode, self.pList, self.search);
                            });
                        });
                        // check and save
                        pc.obj.find('.btn-event-update, .btn-event-create').click(function (e) {
                            var btn = $(this);
                            var eventId = btn.data('event-id');
                            var data = UI.json.form(pc.obj.find(':input'));
                            var json = {};
                            if (eventId) {
                                json.eventId = eventId;
                            }
                            if (data.eventName.length < 3) {
                                pc.showTab(0);
                                //pc.obj.find('[name=eventName]').focus();
                                UI.forms.fields.setFocusError(pc.obj.find('[name=eventName]'), true);
                                return;
                            } else {
                                json.title = data.eventName;
                                json.description = data.eventDesc;
                                json.params = {};
                            }
                            if (!/\d+/.test(data.eventDevice)) {
                                pc.showTab(1);
                                pc.obj.find('[name=eventDevice]').trigger('chosen:open');
                                e.stopPropagation();
                                return;
                            } else {
                                json.params.device = {
                                    id: data.eventDevice
                                };
                            }
                            if (data.eventDeviceExpression == "") {
                                pc.showTab(1);
                                UI.forms.fields.setFocusError(pc.obj.find('.expression-part input:eq(0)'), true);
                                return;
                            } else {
                                json.params.device.expression = data.eventDeviceExpression;
                            }
                            if (data.triggerAllowed) {
                                if (!/\d+/.test(data.eventTriggerDevice)) {
                                    pc.showTab(2);
                                    pc.obj.find('[name=eventTriggerDevice]').trigger('chosen:open');
                                    e.stopPropagation();
                                    return;
                                } else {
                                    json.params.trigger = {
                                        id: data.eventTriggerDevice
                                    };
                                }
                                if (data.eventTriggerExpression == "") {
                                    pc.showTab(2);
                                    UI.forms.fields.setFocusError(pc.obj.find('#eventTriggerExpressions input:eq(0)'), true);
                                    return;
                                } else {
                                    json.params.trigger.expression = data.eventTriggerExpression;
                                }
                            }
                            if (data.notification_type != 'none') {
                                if (data.notification_type == 'get' && data.recipient.length < 5) {
                                    pc.showTab(3);
                                    UI.forms.fields.setFocusError(pc.obj.find('[name=response]'), true);
                                    return;
                                }
                                if (data.notification_type == 'email' && data.recipient.length < 5) {
                                    pc.showTab(3);
                                    UI.forms.fields.setFocusError(pc.obj.find('[name=response]'), true);
                                    return;
                                }
                                if (data.notification_type == 'sms' && data.recipient.length < 5) {
                                    pc.showTab(3);
                                    UI.forms.fields.setFocusError(pc.obj.find('[name=response]'), true);
                                    return;
                                }
                                json.params.notification = {
                                    type: data.notification_type,
                                    recipient: data.recipient,
                                    recipientText: data.recipientText
                                };
                            } else {
                                json.params.notification = {
                                    type: data.notification_type
                                };
                            }
                            if (data.on_completion != '') {
                                json.params.settings = {
                                    on_completion: data.on_completion
                                };
                            } else {
                                json.params.settings = {
                                    on_completion: 'preserve'
                                };
                            }
                            //UI.log(data);
                            //UI.log(json);
                            //return;
                            UI.action('json.events.create', json, function () {
                                self.render(self.jqueryNode, self.pList, self.search);
                            });
                        });
                    }
                });
                return html;
            },
            encodeExpressionString: function (jqueryNodes, str) {
                if (jqueryNodes.length == 0) {
                    return str;
                }
                str = str != '' ? str + ' or ' : str;
                _.each(jqueryNodes, function (node, i) {
                    var _s = $(node).prev();
                    var _in = $(node);
                    if (_in.val() != '') {
                        str += _in.attr('name') + _s.val() + _in.val();
                        if (i < jqueryNodes.length - 1) {
                            str += ' and ';
                        }
                    }
                });
                return str;
            },
            decodeExpressionString: function (str, isTrigger, labels) {
                if (str === '') {
                    return '';
                }
                //UI.log(str);
                //UI.log(labels);
                var _if = App.i18n.locale('events.if'),
                    //_in = labels,
                    _and = App.i18n.locale('events.and'),
                    _or = App.i18n.locale('events.or');
                /* ---------------- */
                var expression_str = !isTrigger ? '<i>' + _if + '</i> ' : '<i>' + App.i18n.locale('events.set_values') + ':</i> ';
                var or = String(str).trim().split(/ or /);
                _.each(or, function (or_con, i) {
                    var c = String(or_con).trim().split(/ and /);
                    if (c.length > 1) {
                        expression_str += '(';
                    }
                    _.each(c, function (con, ii) {
                        var t = String(con).trim().split(/>|=|</);
                        var index = t[0].trim().split(/\./);
                        UI.log(labels);
                        UI.log(t);
                        if (labels) {
                            expression_str += String(t[0]).trim().replace(String(t[0]).trim(), '<b>' + labels[t[0]] + '</b> ');
                        }
                        if (/=/.test(con)) {
                            expression_str += ' = ' + t[1];
                        }
                        else if (/>/.test(con)) {
                            expression_str += ' > ' + t[1];
                        }
                        else if (/</.test(con)) {
                            expression_str += ' < ' + t[1];
                        }
                        if (c.length > 1 && c.length !== (ii + 1)) {
                            expression_str += ' <i>' + _and + '</i> ';
                        }
                    });
                    if (c.length > 1) {
                        expression_str += ') ';
                    }
                    if (or.length !== (i + 1)) {
                        expression_str += ' <i>' + _or + '</i> ';
                    }
                });
                return expression_str;
            }
        },
        statistic: function () {
            UI.action('json.statistic', null, function (json) {
                var companies = [], users = [], devices = [], labels = [];
                _.each(json.stat, function (item) {
                    labels.push(item.day);
                    companies.push(item.amount_companies);
                    users.push(item.amount_users);
                    devices.push(item.amount_devices);
                });
                var maxVal = _.max([_.max(companies), _.max(users), _.max(devices)]);
                var ctx = document.getElementById("statisticByDays").getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        datasets: [{
                            label: App.i18n.locale('text.companies'),
                            data: companies,
                            borderColor: 'rgb(75, 192, 192)',
                            borderWidth: 1,
                            backgroundColor: 'rgba(75, 192, 192, .4)',
                            fill: true,
                            pointRadius: 0,
                            // Changes this dataset to become a line
                            type: 'line'
                        }, {
                            label: App.i18n.locale('text.users'),
                            data: users,
                            borderColor: 'rgb(54, 162, 235)',
                            borderWidth: 1,
                            backgroundColor: 'rgba(54, 162, 235, .4)',
                            fill: true,
                            pointRadius: 0,
                            // Changes this dataset to become a line
                            type: 'line'
                        }, {
                            label: App.i18n.locale('text.devices'),
                            data: devices,
                            borderColor: 'rgb(255, 159, 64)',
                            borderWidth: 1,
                            backgroundColor: 'rgba(255, 159, 64, .4)',
                            fill: true,
                            pointRadius: 0,
                            // Changes this dataset to become a line
                            type: 'line'
                        }],
                        labels: labels
                    },
                    options: {
                        elements: {
                            line: {
                                tension: 0, // disables bezier curves
                            }
                        },
                        animation: {
                            easing: 'linear'
                        },
                        scales: {
                            xAxes: [{
                                display: true,
                                gridLines: {
                                    display: false
                                },
                                scaleLabel: {
                                    display: true,
                                    labelString: App.i18n.locale('text.statistic_for_30_day')
                                }
                            }],
                            yAxes: [{
                                display: true,
                                gridLines: {
                                    display: false
                                },
                                ticks: {
                                    max: maxVal + 2,
                                    min: 0
                                }
                            }]
                        }
                    }
                });
            });
        },
        showTooltip: function (jqueryNode, params, callback) {
            if (jqueryNode && jqueryNode.length > 0) {
                jqueryNode.find('[data-toggle=tooltip]').tooltip($.extend({}, {
                    container: 'body'
                }, params ? params : {}));
            } else {
                $('[data-toggle=tooltip]').tooltip($.extend({}, {
                    container: 'body'
                }, params ? params : {}));
            }
            if (callback) {
                callback();
            }
        },
        initRoute: function (route) {
            var self = this;
            //console.log(App[route]);
            if (route && App.hasOwnProperty(route) && App[route].hasOwnProperty('render')) {
                var content = $('.ibox-content').hide().removeClass('hide');
                $.when(App[route].render(content)).done(function () {
                    self.showTooltip();
                });
            } else {
                $('.ibox-content').removeClass('hide');
                console.log('route [' + route + ']');
            }
            $('.user-group-actions').click(function () {
                var btn = $(this);
                var is = parseInt(btn.data('user-group-actions')) ? 0 : 1;
                UI.action('json.user-group-actions', {checked: is}, [self, self.setGroupActions, is]);
                btn.data('user-group-actions', is);
            });
            $('.nekta-coverage-area').click(function () {
                var modal = UI.modal.create({
                    'title': 'Зона покрытия базовых станций Nekta',
                    content: '<div id="YMapsID"><center><i class="fa fa-refresh fa-spin fa-3x fa-fw"></i></center></div>',
                    afterCreate: function () {
                        var draw = function () {
                            ymaps.ready(function () {
                                ymaps.geolocation.get().then(function (res) {
                                    var $container = $('#YMapsID');
                                    $container.html('');
                                    $container.animate({
                                        height: 600
                                    }, '600');
                                    $container.first().css({height: '600px'});
                                    /*
                                     var bounds = res.geoObjects.get(0).properties.get('boundedBy');
                                     var mapState = ymaps.util.bounds.getCenterAndZoom(
                                     bounds,
                                     [$container.width(), $container.height()]
                                     );
                                     */
                                    var myMap = new ymaps.Map('YMapsID', {
                                        center: [53.52, 49.28],
                                        zoom: 12
                                    });
                                    var myCircleR = new ymaps.GeoObject({
                                        geometry: {
                                            type: "Circle",
                                            coordinates: [53.52, 49.28],
                                            radius: 2000
                                        },
                                        properties: {
                                            hintContent: "Максимальная дальность 2000 метров"
                                        }
                                    });
                                    var myCircle = new ymaps.GeoObject({
                                        geometry: {
                                            type: "Circle",
                                            coordinates: [53.52, 49.28],
                                            radius: 700
                                        },
                                        properties: {
                                            hintContent: "Проникающая способность 700 метров"
                                        }
                                    }, {
                                        fillColor: '#00ff00',
                                        fillOpacity: .3
                                    });
                                    myMap.geoObjects.add(myCircleR).add(myCircle);
                                }, function (e) {
                                    console.log(e);
                                });
                            });
                        };
                        if (typeof ymaps == "undefined") {
                            $.getScript("https://api-maps.yandex.ru/2.1/?lang=ru_RU", function () {
                                draw();
                            });
                        } else {
                            draw();
                        }
                    }
                });
                modal.show();
            });
        },
        drawButtonsGroupActions: function (jqueryNode, forEntity) {
            var self = this;
            var html = '';
            html += '<div class="btn-group margin-20-0">' +
                '<button type="button" class="btn btn-info btn-sm dropdown-toggle disabled" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
                App.i18n.locale('text.group_actions') + '&#160;<span class="caret"></span>' +
                '</button>' +
                '<ul class="dropdown-menu">';
            switch (forEntity) {
                case 'companies':
                    html += '';
                    break;
                case 'users':
                    html += '<li><a href="javascript:void(0);" data-ids="" onclick="App.users.setBanned($(this).data(\'ids\'), 1);">' + App.i18n.locale('text.group_action_set_ban') + '</a></li>' +
                        '<li><a href="javascript:void(0);" data-ids="" onclick="App.users.setBanned($(this).data(\'ids\'), 0);">' + App.i18n.locale('text.group_action_un_ban') + '</a></li>' +
                        '<li><a href="javascript:void(0);" data-ids="" onclick="App.users.remove($(this).data(\'ids\'));">' + App.i18n.locale('text.group_action_remove') + '</a></li>';
                    break;
                case 'devices':
                    html += '<li><a href="javascript:void(0);" data-ids="" onclick="App.devices.remove($(this).data(\'ids\'));">' + App.i18n.locale('text.group_action_remove') + '</a></li>';
                    break;
                default:
                    html += '<li><a href="javascript:void(0);">Unknown entity</a></li>';
            }
            html += '</ul>' +
                '</div>';
            $(html).appendTo(jqueryNode);
        },
        setGroupActions: function (is) {
            var self = this;
            var ib = $('.ibox-content');
            var tl = ib.find('.table-list');
            var t = tl.find('table');
            var th = t.find('thead');
            var tb = t.find('tbody');
            if (is) {
                th.find('th:first').before('<th class="group-actions width-40">&#160;</th>');
                _.each(tb.find('tr[data-key-id]:not([class=detail-open])'), function (tr, i) {
                    //$(tr).find('td').addClass('valign-m');
                    $(tr).find('td:first').before('<td class="group-actions"><div class="checkbox checkbox-info"><input id="input-group-actions-' + i + '" value="' + $(tr).data('key-id') + '" type="checkbox"/><label for="input-group-actions-' + i + '"></label></div></td>');
                });
                self.drawButtonsGroupActions($('<div class="pull-left btns-group-actions"></div>').insertAfter(tl), tl.data('for-entity'));
                tb.find('.group-actions :input').click(function () {
                    var checked = tb.find('.group-actions :input:checked');
                    if (checked.length > 0) {
                        ib.find('.btns-group-actions button').removeClass('disabled');
                        ib.find('.btns-group-actions a').data('ids', _.map(checked, function (e) {
                            return $(e).val();
                        }).join(','));
                    } else {
                        ib.find('.btns-group-actions button').addClass('disabled');
                        ib.find('.btns-group-actions a').data('ids', '');
                    }
                });
            } else {
                th.find('.group-actions').remove();
                tb.find('.group-actions').remove();
                ib.find('.btns-group-actions').remove();
            }
        },
        user: {
            session: {
                timer: null,
                onDestroy: function (timeout) {
                    var self = this;
                    clearTimeout(self.timer);
                    UI.log('reset handler session on destroy [time expires]: ' + moment(moment().valueOf() + timeout).format('DD.MM.YYYY HH:mm:ss.SSSSSS'));
                    self.timer = setTimeout(function () {
                        UI.modal.alert({
                            title: App.i18n.locale('text.attention') + '!',
                            content: '<div align="center">' + App.i18n.locale('text.session_on_destroy') + '</div>',
                            footer: '<button type="button" class="btn btn-danger" data-dismiss="modal" aria-hidden="true">' + App.i18n.locale('text.continue') + '</button>',
                            afterCreate: function () {
                                this.buttons.eq(0).click(function () {
                                    $('body:first').fadeOut('fast');
                                    d.location.reload();
                                });
                            }
                        });
                    }, timeout);
                }
            },
            logout: function () {
                $('body:first').fadeOut('fast');
                UI.afterAction = [];
                UI.action('json.logout', {}, function (json) {
                    if (json.logout) {
                        d.location.reload();
                    }
                });
            },
            offerSwitchLanguage: function () {
                var userLang = String(navigator.language || navigator.userLanguage).replace(new RegExp('(-.*)'), '');
                if (userLang !== App.locale && !UI.cookies.get('switch_language_dialog')) {
                    UI.modal.swal({
                        title: App.i18n.locale('text.switch_language'),
                        text: App.i18n.locale('text.switch_language_text'),
                        type: "info",
                        showCancelButton: true,
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: App.i18n.locale('text.confirm_switch_language_text'),
                        cancelButtonText: App.i18n.locale('text.cancel_switch_language_text'),
                        closeOnConfirm: true,
                        blurHideButtons: [0],
                        showCloseButton: true,
                        extendFunction: function () {
                            UI.cookies.set('switch_language_dialog', 0, ((60 * 60 * 24 * 365) * 1000));
                        }
                    }, function () {
                        $('body:first').fadeOut('fast');
                        //UI.log(userLang);
                        $('a[data-language-code=' + userLang + ']').click();
                        UI.cookies.set('switch_language_dialog', 0, -1);
                    });
                }
            }
        }
    }
;

$(d).ready(function () {
    App.init();
});