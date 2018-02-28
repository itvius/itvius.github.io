var d = d || document;
var w = w || window;

var UI = {
    env: 'production',
    log: function (data) {
        var self = this;
        if (self.env === 'production') {
            return;
        }
        console.log(data);
    },
    uc: function (str) {
        return String(str).substr(0, 1).toUpperCase() + String(str).substr(1);
    },
    methodType: 'post',
    dataType: 'json',
    headers: {
        'Accept': 'application/json'
    },
    timeout: 180000,
    afterAction: [],
    grid: {
        obj: null,
        _prop: {
            jqueryNode: null,
            fields: [],
            columns: [],
            items: [],
            buttons: [
                {
                    extend: 'pdf',
                    exportOptions: {
                        columns: ':visible'
                    }
                },
                {
                    extend: 'excel',
                    exportOptions: {
                        columns: ':visible'
                    }
                },
                {
                    extend: 'csv',
                    charset: 'UTF-8',
                    exportOptions: {
                        columns: ':visible'
                    }
                }
            ],
            dom: "<'row'<'col-sm-12'<'export-buttons'B><'search-input'f>>><'row'<'col-sm-12'tr>>",
            paging: false,
            parsingDates: [],
            onNull: function () {
                return '-';
            },
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
        },
        create: function (prop) {
            var self = this;
            $.extend(self, self._prop, prop ? prop : {});
            self.obj = $('<div><table class="table"></table></div>');
            var table = self.obj.find('table');
            if (self.jqueryNode) {
                self.jqueryNode.html(self.obj);
            } else {
                return self.obj;
            }
            var items = [];
            //var columns = [];
            _.each(self.items, function (item) {
                var i = [];
                _.each(self.fields, function (field) {
                    var v = null;
                    if ($.inArray(field, self.parsingDates) > -1) {
                        v = item[field] ? moment(item[field] * 1000).format('DD MMMM YYYY') : self.onNull();
                    } else {
                        v = item[field] ? item[field] : self.onNull();
                    }
                    i.push(v);
                });
                items.push(i);
            });
            /*
             _.each(self.columns, function (field) {
             columns.push({title: field});
             });
             */
            self.table = table.DataTable({
                language: {
                    search: App.i18n.locale('text.search') + ":"
                },
                bAutoWidth: false,
                data: items,
                columns: self.columns,
                dom: self.dom,
                buttons: self.buttons,
                paging: self.paging,
                createdRow: self.createdRow,
                fnRowCallback: self.fnRowCallback,
                oTableTools: {
                    aButtons: [
                        {
                            sExtends: "pdf",
                            sButtonText: "Special columns",
                            mColumns: [1, 2, 3, 4]
                        },
                        {
                            sExtends: "pdf",
                            sButtonText: "Visible columns",
                            mColumns: "visible"
                        }
                    ]
                }
            });
            self.obj.find('.dataTables_filter :input').removeClass('input-sm');
            self.obj.find('.export-buttons').addClass('pull-right').attr('align', 'center').prepend("<div>" + App.i18n.locale('text.export_displayed_data') + "</div>");
            self.obj.find('.search-input').addClass('pull-right').attr('align', 'center').prepend("<div>&#160;</div>");
            //UI.log(self.table);
            //t.buttons().container().appendTo(self.obj.find('.table-export'));
            /*
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
             */
            return self;
        }
    },
    pagination: {
        obj: null,
        _prop: {
            jqueryNode: null,
            rowsOnList: 1,
            totalRows: 1,
            paginationCount: 1,
            activeList: 0,
            onclick: null,
            size: 'lg',
            effects: false,
            disable: false,
            splitMore: [2, 3, 2]
        },
        create: function (prop) {
            var self = this;
            self = $.extend(self, self._prop, prop);
            if (self.jqueryNode === null) {
                return;
            }
            self.jqueryNode.html('');
            var html = '<nav><ul class="pagination' + ((self.size && self.size !== '') ? (' pagination-' + self.size) : '') + '">';
            self.paginationCount = Math.ceil(self.totalRows / self.rowsOnList);
            var maxLength = _.reduce(self.splitMore, function (memo, num) {
                return memo + num;
            }, 0) + 2;
            var count = 0;
            /*
             while (i <= self.paginationCount) {
             var active = (self.activeList == i) ? 'class="active"' : '';
             if (self.paginationCount > maxLength) {
             if (self.activeList < (self.splitMore[0] + 1)) {

             }
             if (i <= self.splitMore[0]) { // start splitMore[0] if i < pList
             html += '<li ' + active + '><a href="javascript:void(' + i + ');" data-list="' + i + '">' + i + '</a></li>';
             } else if (i >= startLast) { // last splitMore[3]
             html += '<li ' + active + '><a href="javascript:void(' + i + ');" data-list="' + i + '">' + i + '</a></li>';
             } else {
             html += '<li ' + active + '><a href="javascript:void(' + i + ');" data-list="' + i + '">...</a></li>';
             }
             } else {
             //all lists
             html += '<li ' + active + '><a href="javascript:void(' + i + ');" data-list="' + i + '">' + i + '</a></li>';
             }
             i++;
             }
             */
            if (maxLength >= self.paginationCount) {
                // small lists
                count = 1;
                while (count <= self.paginationCount) {
                    var active = (self.activeList == count) ? 'class="active"' : '';
                    html += '<li ' + active + '><a href="javascript:void(' + count + ');" data-list="' + count + '">' + count + '</a></li>';
                    count++;
                }
            } else if (self.activeList < (maxLength - self.splitMore[0])) {
                // from start
                count = 1;
                while (count < (maxLength - self.splitMore[0])) {
                    var active = (self.activeList == count) ? 'class="active"' : '';
                    html += '<li ' + active + '><a href="javascript:void(' + count + ');" data-list="' + count + '">' + count + '</a></li>';
                    count++;
                }
                html += '<li><a data-list="' + count + '">...</a></li>';
                count = self.paginationCount - 3;
                while (count <= self.paginationCount) {
                    var active = (self.activeList == count) ? 'class="active"' : '';
                    html += '<li ' + active + '><a href="javascript:void(' + count + ');" data-list="' + count + '">' + count + '</a></li>';
                    count++;
                }
            } else if (self.activeList > (self.paginationCount - (maxLength - 3))) {
                // from end
                count = 1;
                while (count < 3) {
                    var active = (self.activeList == count) ? 'class="active"' : '';
                    html += '<li ' + active + '><a href="javascript:void(' + count + ');" data-list="' + count + '">' + count + '</a></li>';
                    count++;
                }
                count = self.paginationCount - (maxLength - 3) + 1;
                html += '<li><a data-list="' + (count - 1) + '">...</a></li>';
                while (count <= self.paginationCount) {
                    var active = (self.activeList == count) ? 'class="active"' : '';
                    html += '<li ' + active + '><a href="javascript:void(' + count + ');" data-list="' + count + '">' + count + '</a></li>';
                    count++;
                }
            } else {
                // centred
                count = 1;
                while (count < 3) {
                    var active = (self.activeList == count) ? 'class="active"' : '';
                    html += '<li ' + active + '><a href="javascript:void(' + count + ');" data-list="' + count + '">' + count + '</a></li>';
                    count++;
                }
                // center start
                count = self.activeList - self.splitMore[0];
                html += '<li><a data-list="' + (count - 1) + '">...</a></li>';
                while (count < (self.activeList + 3)) {
                    var active = (self.activeList == count) ? 'class="active"' : '';
                    html += '<li ' + active + '><a href="javascript:void(' + count + ');" data-list="' + count + '">' + count + '</a></li>';
                    count++;
                }
                // center end
                html += '<li><a data-list="' + (count - 1) + '">...</a></li>';
                //html += '<li data-func="pagination" class="inline" data-list="' + count + '">...</li>';
                count = self.paginationCount - self.splitMore[0] + 1;
                while (count <= self.paginationCount) {
                    var active = (self.activeList == count) ? 'class="active"' : '';
                    html += '<li ' + active + '><a href="javascript:void(' + count + ');" data-list="' + count + '">' + count + '</a></li>';
                    count++;
                }
//                console.log('trouble');
            }
            html += '</ul></nav>';
            self.obj = $(html);
            if (self.effects) {
                self.obj.hide();
                self.obj.fadeIn();
            }
            if (self.disable) {
                self.disabled();
            }
            self.obj.appendTo(self.jqueryNode);
            self.setHandlers();
            return self;
        },
        enabled: function () {
            var self = this;
            self.obj.find('li').removeClass('disabled');
            self.disable = false;
        },
        disabled: function () {
            var self = this;
            self.disable = true;
            self.obj.find('li').filter(':not(.active)').addClass('disabled');
        },
        isDisabled: function () {
            var self = this;
            return self.disable;
        },
        setHandlers: function () {
            var self = this;
            if (!self.onclick) {
                return;
            }
            var a = self.obj.find('ul a');
            a.click(function () {
                if (self.isDisabled()) {
                    return;
                }
                self.onclick.call(this);
            });
        }
    },
    convertRouteToTitle: function (route, i18n, prefix) {
        var title = null;
        prefix = prefix ? prefix : 'logs';
        var route_path = prefix + '.' + String(route).replace('json.', '').split('.').join('_');
        UI.log(route_path);
        switch (route) {
            default:
                title = '<span class="label label-default">' + i18n.locale(route_path) + '</span>';
        }
        return title;
    },
    action: function (uri, data, callback, dataType) {
        var self = this;
        var headers = {};
        dataType = dataType || self.dataType;
        switch (dataType) {
            case 'html':
                headers = {'Accept': 'text/html'}
                break;
            default:
                headers = self.headers;
                ;
        }
        return $.ajax({
            headers: headers,
            url: '/' + uri,
            global: false,
            type: self.methodType,
            cache: false,
            data: data,
            dataType: dataType,
            timeout: self.timeout,
            complete: function (response) {
                if (self.afterAction instanceof Array) {
                    _.map(self.afterAction, function (i) {
                        i(response);
                    });
                } else {
                    UI.log('$.ajax->afterAction is not Array!');
                }
            },
            success: function (response) {
                if (callback) {
                    if (typeof callback === 'object') {
                        var arg = [].concat((callback && callback.length > 2) ? callback[2] : [], response);
                        callback[1].apply(callback[0], arg);
                    } else {
                        callback(response);
                    }
                    //callback(response);
                } else {
                    //self.log(response);
                }
            },
            error: function () {
                console.log(arguments);
            }
        });
    },
    json: {
        form: function (jqueryNodes) {
            var json = {};
            _.map(jqueryNodes, function (e) {
                var val = null;
                var name = $(e).attr('name') || $(e).attr('id');
                if (!name || $(e).hasClass('ignore')) {
                    return;
                }
                switch ($(e).attr('type')) {
                    case 'radio':
                        val = jqueryNodes.filter('[name=' + name + ']:checked').val();
                        break;
                    case 'date-time':
                        val = $(e).attr('timestamp');
                        break;
                    case 'checkbox':
                        val = $(e).is(':checked') ? 1 : 0;
                        break;
                    default:
                        val = $(e).val();
                }
                json[name] = val;
            });
            return json;
        }
    },
    getScripts: function (scripts) {
        var _arr = $.map(scripts, function (src) {
            return $.getScript(src);
        });

        _arr.push($.Deferred(function (deferred) {
            $(deferred.resolve);
        }));

        return $.when.apply($, _arr);
    },
    contentManagement: {
        _props: {
            backListText: 'back_to_the_list_of_devices',
            contexts: {
                prev: {},
                new: {}
            }
        },
        pool: [],
        create: function (props) {
            var self = this;
            var _new = $.extend({}, self, self._props, props ? props : {});
            return _new;
        },
        push: function (props) {
            var self = this;
            self = $.extend({}, self, props ? props : {});
            self.pool.push(self);
            self.contexts.prev.content.animate({
                //width: "toggle",
                height: "toggle",
                opacity: "toggle"
            }, {
                duration: "fast",
                specialEasing: {
                    width: "linear",
                    height: "easeOutQuad"
                },
                complete: function () {
                    var prev = _.last(self.pool).contexts.prev;
                    var next = _.last(self.pool).contexts.new;
                    var a = $('<div class="m-b-lg m-t-sm"><a href="javascript:void(0);" id="rollback-btn"><i class="fa fa-2x fa-arrow-left text-primary" style="position:relative;top:4px;"></i>&#160;&#160;&#160;' + self.backListText + '</a></div>');
                    a.find('a').click(function () {
                        if (self.pool.length) {
                            self.obj.first().html(prev.content);
                            if (prev.renderFunctions) {
                                if (typeof(prev.renderFunctions) === 'array') {

                                } else {
                                    var args = prev.args ? prev.args : [];
                                    prev.renderFunctions.apply(prev.context, args);
                                    self.obj.slideDown();
                                }
                            }
                        }
                        //self.clickToBack();
                    });
                    if (next.content) {
                        next.content.first().prepend(a);
                        self.obj.first().html(next.content);
                    }
                    if (next.renderFunctions) {
                        if (typeof(next.renderFunctions) === 'array') {

                        } else {
                            var args = next.args ? next.args : [];
                            args.push([prev.context, prev.renderFunctions, prev.args]);
                            next.renderFunctions.apply(next.context, args);
                        }
                    }
                    self.obj.slideDown();
                }
            });
            //UI.log(self.pool);
        }

    },
    switch: {
        create: function (props) {
            props = _.extend({
                id: (props && props.hasOwnProperty('id')) ? props.id : _.uniqueId('new-switch-'),
                text: 'text for switch',
                on_off_text: ['Off', 'On'],
                use_br: false,
                checked: false
            }, props);
            var html = '<div class="switch' + (!props.use_br ? ' flex-block' : '') + '">' +
                '<span class="' + (props.use_br ? 'block m-b-xs' : 'm-r-sm') + '">' + props.text + '</span>' +
                '<div class="onoffswitch' + (props.use_br ? '' : '') + '">' +
                '<input type="checkbox" class="onoffswitch-checkbox" id="' + props.id + '" name="' + props.id + '" ' + (props.checked ? 'checked="checked"' : '') + '/>' +
                '<label class="onoffswitch-label" for="' + props.id + '">' +
                '<span class="onoffswitch-inner" data-on="' + props.on_off_text[1] + '" data-off="' + props.on_off_text[0] + '"></span>' +
                '<span class="onoffswitch-switch"></span>' +
                '</label></div>' +
                '</div>';
            return html;
        }
    },
    transliterate: function (text, params) {
        text = text
            .replace(/\u0401/g, 'YO')
            .replace(/\u0419/g, 'I')
            .replace(/\u0426/g, 'TS')
            .replace(/\u0423/g, 'U')
            .replace(/\u041A/g, 'K')
            .replace(/\u0415/g, 'E')
            .replace(/\u041D/g, 'N')
            .replace(/\u0413/g, 'G')
            .replace(/\u0428/g, 'SH')
            .replace(/\u0429/g, 'SCH')
            .replace(/\u0417/g, 'Z')
            .replace(/\u0425/g, 'H')
            .replace(/\u042A/g, '')
            .replace(/\u0451/g, 'yo')
            .replace(/\u0439/g, 'i')
            .replace(/\u0446/g, 'ts')
            .replace(/\u0443/g, 'u')
            .replace(/\u043A/g, 'k')
            .replace(/\u0435/g, 'e')
            .replace(/\u043D/g, 'n')
            .replace(/\u0433/g, 'g')
            .replace(/\u0448/g, 'sh')
            .replace(/\u0449/g, 'sch')
            .replace(/\u0437/g, 'z')
            .replace(/\u0445/g, 'h')
            .replace(/\u044A/g, "'")
            .replace(/\u0424/g, 'F')
            .replace(/\u042B/g, 'I')
            .replace(/\u0412/g, 'V')
            .replace(/\u0410/g, 'a')
            .replace(/\u041F/g, 'P')
            .replace(/\u0420/g, 'R')
            .replace(/\u041E/g, 'O')
            .replace(/\u041B/g, 'L')
            .replace(/\u0414/g, 'D')
            .replace(/\u0416/g, 'ZH')
            .replace(/\u042D/g, 'E')
            .replace(/\u0444/g, 'f')
            .replace(/\u044B/g, 'i')
            .replace(/\u0432/g, 'v')
            .replace(/\u0430/g, 'a')
            .replace(/\u043F/g, 'p')
            .replace(/\u0440/g, 'r')
            .replace(/\u043E/g, 'o')
            .replace(/\u043B/g, 'l')
            .replace(/\u0434/g, 'd')
            .replace(/\u0436/g, 'zh')
            .replace(/\u044D/g, 'e')
            .replace(/\u042F/g, 'Ya')
            .replace(/\u0427/g, 'CH')
            .replace(/\u0421/g, 'S')
            .replace(/\u041C/g, 'M')
            .replace(/\u0418/g, 'I')
            .replace(/\u0422/g, 'T')
            .replace(/\u042C/g, "'")
            .replace(/\u0411/g, 'B')
            .replace(/\u042E/g, 'YU')
            .replace(/\u044F/g, 'ya')
            .replace(/\u0447/g, 'ch')
            .replace(/\u0441/g, 's')
            .replace(/\u043C/g, 'm')
            .replace(/\u0438/g, 'i')
            .replace(/\u0442/g, 't')
            .replace(/\u044C/g, "'")
            .replace(/\u0431/g, 'b')
            .replace(/\u044E/g, 'yu')
            .replace(/ /g, '');
        if (params && params.hasOwnProperty('extendCharsDeleted')) {
            var pattern = '/' + params.extendCharsDeleted + '/g';
            text = text.replace(pattern, '');
        }
        if (params && params.hasOwnProperty('isProperty')) {
            text = text
                .split(' ')
                .join('')
                .replace(/'|-/g, '');
        }
        return text;
    },
    dropdown: {
        create: function (items, props) {
            props = _.extend({});
            var html = '';
        }
    },
    select: {
        create: function (items, props) {
            props = _.extend({
                selectName: 'new_select' + _.uniq(),
                selectClasses: '',
                selectType: 'dropdown',
                isOptGroups: false,
                selectRequired: false,
                dataFields: null,
                placeholder: false,
                optionChoose: false,
                optionAll: false,
                optionFieldValue: 'id',
                optionFieldTitle: 'title',
                defaultValue: null,
                activeItemId: null,
                multiple: false,
                i18n: false,
                group_id: '',
                i18n_prefix: 'text.',
                where: null,
                checkSelected: false,
                isDisabled: false
            }, props);
            //console.log(props);
            var html = '<select id="' + props.selectName + '" ' + (!items || !items.length || props.isDisabled ? 'disabled="disabled"' : '') + ' class="' + props.selectClasses + '" data-type="' + props.selectType + '" name="' + props.selectName + '"' + ' data-default-value="' + props.defaultValue + '"' +
                (props.selectRequired ? ' required="required"' : '') + (props.multiple ? ' multiple="multiple"' : '') + (props.placeholder ? (' data-placeholder="' + props.placeholder + '"') : '') + '>' +
                (props.optionChoose ? '<option value="null" selected="selected">' + props.optionChoose + '</option>' : '') +
                (props.optionAll ? '<option value="null" selected="selected">' + props.optionAll + '</option>' : '');
            if (props.where) {
                items = _.findWhere(items, props.where);
            }
            _.each(items, function (item, i) {
                if (item.hasOwnProperty('isOptGroup')) {
                    html += '<optgroup label="' + item[props.optionFieldTitle] + '">';

                } else {
                    if (props.isOptGroups && item.group_id && !(items[i - 1] && items[i - 1].group_id === item.group_id)) {
                        html += '<optgroup label="' + item.group + '" data-id="' + item.group_id + '">';
                    }
                    html += '<option value="' + item[props.optionFieldValue] + '" ' + (item.id == props.activeItemId ? 'selected="selected"' : '');
                    html += (props.checkSelected && item.selected) ? ' selected="selected"' : '';
                    _.each(props.dataFields, function (f) {
                        html += ' data-' + f + '="' + item[f] + '"';
                    });
                    html += '>' + (props.i18n ? props.i18n.locale(props.i18n_prefix + item[props.optionFieldTitle]) : item[props.optionFieldTitle]);
                    html += '</option>';
                    if (item.hasOwnProperty('nextDivider') && item.nextDivider) {
                        html += '<option data-divider="true"></option>';
                    }
                    if (props.isOptGroups && item.group_id && (items[i + 1] && items[i + 1].group_id != item.group_id)) {
                        html += '</optgroup>';
                    }
                }
            });
            html += '</select>';
            return html;
        }
    },
    lineBreaks: function (str) {
        return String(str).split('\n').join('<br/>');
    },
    replaceStrings: function (str) {
        var replaced = [
            {search: '"', replace: '&quot;'}
        ];
        _.each(replaced, function (i) {
            str = String(str).replace(new RegExp(i.search, 'g'), i.replace);
        });
        return str;
    },
    teststring: function (regExp, str) {
        return regExp.test(str);
    },
    pageControl: {
        _props: {
            name: 'newPageControl',
            jqueryNode: null,
            tabs: [],
            icons: false,
            tabNames: [],
            tabContents: [],
            tabDisabled: [],
            tabOrientation: 'top',
            effectShow: 'animated slideInRight',
            minHeight: 600,
            tabEvents: [],
            tabEventsAfterCreated: [],
            tabActive: null,
            tabDefaultIndex: 0,
            afterCreate: function () {
                this.loadingHide();
            },
            alwaysTabClick: function () {
            }
        },
        create: function (props) {
            var self = this;
            var attr = null;
            attr = $.extend({}, self._props, props ? props : {});
            attr.jqueryNode.html('');
            var html = '<div class="tabs-container"><div class="tabs-' + attr.tabOrientation + '"><ul class="nav nav-tabs"><i class="pull-right fa fa-fw fa-2x fa-refresh fa-spin m-t-xs m-r-xs state"></i></ul><div class="tab-content"></div></div></div>';
            attr.obj = $(html);
            attr.nt = attr.obj.find('.nav-tabs');
            attr.tc = attr.obj.find('.tab-content');
            attr.tc.css({height: (attr.minHeight - attr.nt.height()) + 'px'});
            attr.tabs = [];
            attr.obj.appendTo(attr.jqueryNode);
            /*
            attr.disabledTab = function (tabIndex) {
                if (tabIndex > 0 && tabIndex <= attr.tabs.length) {
                    attr.tabs[tabIndex].tab.first().addClass('disabled');
                }
            };
            */
            attr.showTab = function (tabIndex) {
                if (tabIndex < 0 && tabIndex >= attr.tabs.length) {
                    return;
                }
                if (attr.tabActive) {
                    attr.nt.find('li').eq(attr.tabActive.index).removeClass('active');
                    attr.tc.find('.tab-pane').eq(attr.tabActive.index).removeClass('active');
                }
                attr.nt.find('li').eq(tabIndex).addClass('active');
                attr.tc.find('.tab-pane').eq(tabIndex).addClass('active');
                attr.tabActive = attr.tabs[tabIndex];
                attr.tabActive.tab.find('a').trigger('click');
            };
            attr.addTab = function (params) {
                var attr = this;
                params = $.extend({
                    afterIndex: attr.tabs.length,
                    name: 'new Tab ' + attr.tabs.length,
                    icon: null,
                    content: 'new content for tab #' + attr.tabs.length,
                    shown: false
                }, params ? params : {});
                var tab = $('<li data-tab-index="' + attr.tabs.length + '"><a href="#' + attr.name + '-' + attr.tabs.length + '" data-tab-index="' + params.afterIndex + '" data-toggle="tab">' +
                    (params.icon ? '<i class="' + params.icon + '"></i>&#160;' : '') + '<span>' + params.name + '</span></a></li>');
                var content = $('<div id="' + attr.name + '-' + attr.tabs.length + '" class="tab-pane h-100p"><div class="panel-body h-100p"></div></div>');
                content.find('.panel-body').append(params.content);
                if (params.afterIndex != attr.tabs.length) {
                    attr.nt.find('li:eq(' + params.afterIndex + ')').after(tab);
                } else {
                    attr.nt.append(tab);
                }
                content.appendTo(attr.tc);
                var newTab = {
                    name: params.name,
                    tab: tab,
                    content: content,
                    index: params.afterIndex < attr.tabs.length ? attr.tabs.length : params.afterIndex
                };
                attr.tabs.splice(params.afterIndex + 1, 0, newTab);
                //attr.tabNames.push(newTab.name);
                //attr.tabContents.push(newTab.content);
                /**/
                newTab.tab.find('a').click(function (e) {
                    if (tab.hasClass('disabled')) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }
                    if (attr.tabActive.index != newTab.index) {
                        attr.showTab(newTab.index);
                    }
                    attr.alwaysTabClick.apply(attr);
                    if (attr.tabEvents[newTab.index]) {
                        //UI.log(attr.tabActive);
                        attr.tabEvents[newTab.index].apply(attr, [e, attr.tabActive]);
                    }
                });
                if (params.shown) {
                    attr.showTab(newTab.index);
                }
                return newTab;
            };
            attr.delTab = function (index) {
                var a = attr.tabs.splice(index, 1);
                a[0].tab.remove();
                a[0].content.remove();
                return index;
            };
            attr.prevTab = function () {
                //console.log(this);
                if (!attr.tabActive) {
                    UI.log('Not tabActive');
                    return;
                }
                if ((attr.tabActive.index - 1) < 0) {
                    UI.log('prev: end of tabs');
                    return;
                }
                attr.showTab(attr.tabActive.index - 1);
                //attr.nt.find('li').eq(attr.tabActive.index - 1).find('a').trigger('click');
            };
            attr.nextTab = function () {
                //console.log(this);
                if (!attr.tabActive) {
                    UI.log('Not tabActive');
                    return;
                }
                if ((attr.tabActive.index + 1) >= attr.tabs.length) {
                    UI.log('next: end of tabs');
                    return;
                }
                attr.showTab(attr.tabActive.index + 1);
                //attr.nt.find('li').eq(attr.tabActive.index + 1).find('a').trigger('click');
            };
            /*
            attr.showTab = function (index) {
                if (attr.tabActive && attr.tabActive.index === index) {
                    UI.log('this tab already shown');
                    return;
                }
                if (index > attr.tabs.length) {
                    UI.log('no tab index of tabs');
                    return;
                }
                if (attr.tabActive) {
                    attr.nt.find('li').eq(attr.tabActive.index).removeClass('active');
                    attr.tc.find('.tab-pane').eq(attr.tabActive.index).removeClass('active');
                }
                attr.nt.find('li').eq(index).addClass('active');
                attr.tc.find('.tab-pane').eq(index).addClass('active');
                //attr.nt.find('li').eq(index).find('a').trigger('click');
                attr.tabActive = attr.tabs[index];
            };
            */
            attr.loadingShow = function () {
                var self = this;
                self.nt.find('.state').removeClass('hide');
            };
            attr.loadingHide = function () {
                var self = this;
                self.nt.find('.state').addClass('hide');
            };
            /* create */
            _.each(attr.tabNames, function (item, i) {
                var icon = '';
                if (attr.icons && typeof attr.icons === 'object') {
                    icon = attr.icons[i];
                } else {
                    icon = attr.icons;
                }
                attr.addTab({
                    afterIndex: i,
                    name: item,
                    icon: icon,
                    content: attr.tabContents[i],
                    shown: false
                });
                /*
                var tab = $('<li data-tab-index="' + i + '"><a href="#' + attr.name + '-' + i + '" data-tab-index="' + i + '" data-toggle="tab">' +
                    (icon ? '<i class="' + icon + '"></i>&#160;' : '') + '<span>' + item + '</span></a></li>');
                attr.nt.append(tab);
                if (attr.tabDisabled.length > 0 && $.inArray(i, attr.tabDisabled) > -1) {
                    tab.first().addClass('disabled');
                }
                */
                /* events */
                /*
                tab.find('a').click(function (e) {
                    //console.log(attr);
                    if (tab.hasClass('disabled')) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }
                    attr.tabActive = attr.tabs[parseInt($(this).data('tab-index'))];
                    attr.alwaysTabClick();
                    if (attr.tabEvents[i]) {
                        //UI.log(attr.tabActive);
                        attr.tabEvents[i].apply(attr, [e, attr.tabActive]);
                    }
                });
                /*
                var content = $('<div id="' + attr.name + '-' + i + '" class="tab-pane h-100p"><div class="panel-body h-100p"></div></div>');
                content.appendTo(attr.tc);
                if (attr.tabContents[i]) {
                    content.find('.panel-body').append(attr.tabContents[i]);
                }
                */
                /*
                attr.tabs.push({
                    name: item,
                    tab: tab,
                    content: content,
                    index: i
                });
                */
                if (attr.tabEventsAfterCreated[i]) {
                    attr.tabEventsAfterCreated[i].apply(attr, [null, attr.tabs[i]]);
                }
            });
            if (attr.tabDefaultIndex > -1) {
                attr.showTab(attr.tabDefaultIndex);
                /*
                attr.nt.find('li').eq(attr.tabDefaultIndex).addClass('active');
                attr.tc.find('.tab-pane').eq(attr.tabDefaultIndex).addClass('active');
                attr.nt.find('li').eq(attr.tabDefaultIndex).find('a').trigger('click');
                */
            }
            if (attr.afterCreate) {
                attr.afterCreate.apply(attr, arguments);
            }
            return attr;
        }
    },
    forms: {
        fields: {
            setFocusError: function (jqueryNodeError, focus) {
                focus = arguments.length > 1 ? arguments[1] : true;
                jqueryNodeError.one('keyup', function () {
                    $(this).parent().removeClass('has-error');
                }).parent().addClass('has-error');
                if (focus) {
                    setTimeout(function () {
                        jqueryNodeError.focus();
                    }, 100);
                }
                return jqueryNodeError;
            }
        }
    },
    modal: {
        obj: null,
        _prop: {
            id: 'UI-mw-' + new Date().getTime(),
            title: 'New modal window',
            content: 'Content for window...',
            footer: '<button type="button" class="btn btn-default" data-dismiss="modal" aria-hidden="true">close</button>',
            size: 'lg',
            sizeClassName: '',
            bodyBlur: true,
            showEffects: 'animated fadeIn',// animated flipInY
            fields: null,
            buttons: null,
            titleCloseButton: true,
            keyboardSupported: true,
            backdropClose: true,
            buttonDirection: 'lr',
            state: 'free',
            i18nUse: {
                object: null,
                prefix: 'text.'
            },
            exec: function () {
            },
            beforeCreate: function () {
            },
            afterCreate: function () {
            },
            beforeShow: function () {
            },
            afterShow: function () {
            },
            beforeHide: function () {
            },
            afterHide: function () {
            }
        },
        swal: function (props, func) {
            var args = Array.prototype.slice.call(arguments);
            $('#wrapper').addClass('blur');
            swal.apply(this, args);
            var _swal = $('.sweet-alert');
            //$('.sweet-alert button').eq(0)
            if (props.hasOwnProperty('showCloseButton')) {
                _swal.prepend('<div class="pull-right btn-close"><i class="fa fa-fw fa-window-close-o fa-2x text-danger" style="cursor: pointer;"></i></div>');
                _swal.find('.btn-close').click(function () {
                    $('#wrapper').removeClass('blur');
                    swal.close();
                    $('.sweet-alert, .sweet-overlay').remove();
                });
            }
            if (props.hasOwnProperty('blurHideButtons') && !$('body').hasClass('modal-open')) {
                _.each(props.blurHideButtons, function (i) {
                    $('.sweet-alert button').eq(i).one('click', function () {
                        $('#wrapper').removeClass('blur');
                        if (props.extendFunction) {
                            props.extendFunction();
                        }
                    });
                });
            } else if (args.length > 2) {
                $('.sweet-alert button').one('click', function () {
                    $('#wrapper').removeClass('blur');
                });
            }
            return _swal;
        },
        alert: function (prop) {
            var self = this;
            var alert = self.create($.extend({}, self._prop, {
                title: 'New alert!',
                content: 'Content for alert window...',
                footer: '<button type="button" class="pull-right btn btn-outline btn-default" data-dismiss="modal" aria-hidden="true">cancel</button>',
                titleCloseButton: false,
                keyboardSupported: false,
                size: 'sm',
                backdropClose: false,
            }, prop ? prop : {}));
            alert.getHeader().addClass('bg-danger');
            alert.getFooter().css({'text-align': 'center'});
            alert.buttons.removeClass('btn-default').addClass('btn-danger');
            return alert;
        },
        confirm: function (prop) {
            var self = this;
            var confirm = self.create($.extend({}, self._prop, {
                title: 'New confirm!',
                content: 'Content for confirm window...',
                footer:'<button type="button" class="pull-left btn btn-primary" aria-hidden="true">confirm</button>' +
                        '<button type="button" class="pull-right btn btn-outline btn-default" data-dismiss="modal" aria-hidden="true">cancel</button>',
                titleCloseButton: false,
                keyboardSupported: false,
                size: 'sm',
                backdropClose: false,
                onOk: function () {
                    UI.log('press OK!');
                },
                exec: function () {
                    var self = this;
                    self.buttons.eq(0).click(function (e) {
                        self.onOk(e);
                    });
                }
            }, prop ? prop : {}));
            //confirm.getHeader().addClass('bg-warning');
            confirm.getFooter().css({'text-align': 'center'});
            if(confirm.buttonDirection != 'lr'){
                var l = confirm.getFooter('.pull-left');
                var r = confirm.getFooter('.pull-right');
                l.switchClass('pull-left', 'pull-right');
                r.switchClass('pull-right', 'pull-left');
            }
            return confirm;
        },
        create: function (prop) {
            var self = this;
            var attr = $.extend({}, self, self._prop, prop ? prop : {});
            var _html = '' +
                '<div class="modal fade" id="' + attr.id + '" ' + ((!attr.backdropClose) ? 'data-backdrop="static"' : '') + ' tabindex="-1" role="dialog" aria-hidden="true">' +
                '<div class="modal-dialog ' + (attr.sizeClassName !== '' ? attr.sizeClassName : 'modal-' + attr.size) + '">' +
                '<div class="modal-content' + ((attr.showEffects !== '') ? (' ' + attr.showEffects) : '') + '">' +
                '<div class="modal-header" style="padding:0;">' +
                ((attr.titleCloseButton) ? '<button type="button" class="btn btn-danger pull-right modal-closed" data-dismiss="modal" aria-hidden="true">x</button>' : '') +
                '<h2 class="modal-title" style="padding:15px 10px 10px 15px;">' + attr.title + '</h2>' +
                //                    '<div class="clearfix"></div>' +
                '</div>' +
                '<div class="modal-body" style="padding:15px;">' + attr.content + '</div>' +
                '<div class="modal-footer' + (attr.footer === '' ? ' hide' : '') + '" style="padding:15px;">' + attr.footer + '</div>' +
                '</div></div></div>';
            attr.obj = $(_html);
            attr.obj.appendTo('body');
            attr.obj.modal({keyboard: attr.keyboardSupported});
            attr.backdrop = $(attr.obj).next();
            attr.toForward();
            // css closed add
            $('.modal-closed').css({
                'width': '40px',
                'border-radius': '0 0 0 4px',
                'padding': '0',
                'margin': '1px 1px 0 0'
            });
            attr.obj.on('hide.bs.modal', function () {
                if (attr.beforeHide) {
                    attr.beforeHide();
                }
            });
            attr.obj.on('hidden.bs.modal', function () {
                if (attr.afterHide) {
                    attr.afterHide();
                }
                attr.__destruct();
                if ($('.modal').length > 0) {
                    $('body').addClass('modal-open');
                }
                if (attr.bodyBlur && $('.modal').length == 0) {
                    $('#wrapper').removeClass('blur');
                }
            });
            attr.obj.on('show.bs.modal', function () {
                if (attr.bodyBlur) {
                    $('#wrapper').addClass('blur');
                }
            });
            attr.obj.on('shown.bs.modal', function () {
                if (attr.afterShow) {
                    attr.afterShow();
                }
            });
            if (attr.beforeCreate) {
                attr.beforeCreate();
            }
            attr.render();
            attr.exec();
            if (attr.i18nUse.object) {
                var i18n = attr.i18nUse.object;
                var prefix = attr.i18nUse.prefix;
                _.map(attr.buttons, function (btn) {
                    $(btn).text(i18n.locale(prefix + $(btn).text()));
                });
            }
            var modal = attr.__construct(attr);
            if (modal.afterCreate) {
                modal.afterCreate();
            }
            return modal;
        },
        __construct: function (proto) {
            function F() {
            };
            F.prototype = proto;
            return new F;
        },
        __destruct: function () {
            var self = this;
            //UI.log(self);
            self.backdrop.remove();
            self.obj.remove();
            return self;
        },
        __state: function (state) {
            var h = this.getHeader();
            switch (state) {
                case 'loading':
                    h.find('.state-loading').remove();
                    h.prepend('<div class="pull-right state-loading p-h-sm m-r-sm"><i class="fa fa-fw fa-refresh fa-2x fa-spin"></i></div>');
                    break;
                case 'free':
                    h.find('.state-loading').remove();
                    break;
                default:
                    ;
            }
            this.state = state;
            return this.state;
        },
        toForward: function () {
            var modals = $('.modal');
            if (modals.length > 1) {
                var zIndex = parseInt(modals.eq(modals.length - 2).css('z-index'));
                this.obj.css('cssText', 'z-index: ' + (zIndex + 15) + ' !important;');
                this.backdrop.css('cssText', 'z-index: ' + (zIndex + 14) + ' !important;');
            }
        },
        render: function () {
            this.fields = this.getFields();
            this.buttons = this.obj.find('.modal-body button, .modal-footer button');
            return this;
            //UI.log(this.buttons);
        },
        getFields: function () {
            return this.obj.find('.modal-body :input');
        }
        ,
        fieldFocus: function (num, cursorEnd) {
            var field = this.getFields().eq(num);
            if (field) {
                field.focus();
                if (cursorEnd) {
                    var len = field.val().length;
                    field[0].setSelectionRange(len, len);
                }
            }
        }
        ,
        autoHideInterval: null,
        autoHide: function (seconds, content) {
            var self = this;
            content = (content) ? content : 'content message';
            self.getHeader().hide();
            self.setFooter('<div align="center">окно закроется автоматически, через ' + seconds + '</div>');
            self.setContent(content);
            self.centering();
            self.autoHideInterval = setInterval(function () {
                if (seconds <= 1) {
                    clearInterval(self.autoHideInterval);
                    self.hide();
                }
                self.setFooter('<div align="center">окно закроется автоматически, через ' + (seconds - 1) + '</div>');
                seconds--;
            }, 1000);
        },
        centering: function () {
            var element = this.obj.find('.modal-dialog');
            var new_margin = Math.ceil(($(w).height() - element.height()) / 2);
            element.animate({
                'margin-top': new_margin + 'px'
            }, 'fast');
        }
        ,
        getHeader: function (selectors) {
            return this.obj.find('.modal-header' + ((selectors) ? ' ' + selectors : ''));
        }
        ,
        getContent: function (selectors) {
            return this.obj.find('.modal-body' + ((selectors) ? ' ' + selectors : ''));
        }
        ,
        getContentHTML: function () {
            return this.obj.find('.modal-body').html();
        }
        ,
        setContent: function (content) {
            this.obj.find('.modal-body').html('');
            content = $(content).appendTo(this.obj.find('.modal-body'));
            this.render();
            return content;
        }
        ,
        lockFooter: function () {
            var btns = this.getFooter(':button');
            btns.addClass('disabled');
        }
        ,
        unlockFooter: function () {
            var btns = this.getFooter(':button');
            btns.removeClass('disabled');
        }
        ,
        getFooter: function (selectors) {
            return this.obj.find('.modal-footer' + ((selectors) ? ' ' + selectors : ''));
        }
        ,
        getFooterHTML: function () {
            return this.obj.find('.modal-footer').html();
        }
        ,
        setFooter: function (content) {
            this.obj.find('.modal-footer').html('');
            var footer = $(content).appendTo(this.obj.find('.modal-footer'));
            this.render();
            return footer;
        }
        ,
        show: function (afterShow) {
            var self = this;
            if (self.beforeShow) {
                self.beforeShow();
            }
            self.obj.modal('show');
            if (afterShow) {
                afterShow();
            }
            return self;
            /*if (self.afterShow) {
             self.afterShow();
             }
             // slimScroll
             //this.obj.find('.modal-body').css({'max-height':'600px'});
             /*
             setTimeout(function () {
             var mb = self.obj.find('.modal-body');
             //UI.log(mb.outerHeight());
             mb.slimScroll({
             height: mb.outerHeight(),
             railOpacity: 0.4,
             wheelStep: 10,
             allowPageScroll: true,
             alwaysVisible: true
             });
             }, 1000);
             */
            //UI.fix.blured();
        },
        hide: function (afterHide) {
            var self = this;
            self.obj.modal('hide');
            if (self.autoHideInterval) {
                clearInterval(self.autoHideInterval);
            }
            return self;
        },
        json: function (extend) {
            var obj = {};
            _.each(this.fields, function (e) {
                obj[$(e).attr('name') || $(e).attr('id')] = $(e).val();
            });
            return obj;
        }
    },
    cookies: {
        getVal: function (offset) {
            var endstr = d.cookie.indexOf(";", offset);
            if (endstr == -1) {
                endstr = d.cookie.length;
            }
            return unescape(d.cookie.substring(offset, endstr));
        },
        get: function (name) {
            var arg = name + "=";
            var alen = arg.length;
            var clen = d.cookie.length;
            var i = 0;
            while (i < clen) {
                var j = i + alen;
                if (d.cookie.substring(i, j) == arg)
                    return this.getVal(j);
                i = d.cookie.indexOf(" ", i) + 1;
                if (i == 0)
                    break;
            }
            return null;
        },
        set: function (name, value) {
            var argv = arguments;
            var argc = arguments.length;
            /* ******* */
            var largeExpDate = new Date();
            largeExpDate.setTime(largeExpDate.getTime() + (((argc > 2) ? argv[2] : 60 * 60) * 1000));
            /* ******* */
            var expires = largeExpDate;
            var path = (argc > 3 && argv[3]) ? argv[3] : '/';
            var domain = (argc > 4 && argv[4]) ? argv[4] : w.location.hostname;
            var secure = (argc > 5) ? argv[5] : false;
            var http_only = (argc > 6) ? argv[6] : false;
            var cookie = name + "=" + escape(value) +
                ((expires == null) ? "" : ("; expires=" + expires.toGMTString())) +
                ((path == null) ? "" : ("; path=" + path)) +
                ((domain == null) ? "" : ("; domain=" + domain)) +
                ((secure == true) ? "; secure" : "") +
                ((http_only == true) ? "; httponly" : "");
            d.cookie = cookie;
        }
    },
    uploads: {
        create: function (prop) {
            if (!prop) {
                return false;
            }
            var id = _.uniqueId('form-'),
                html = '',
                form = null;
            if ($(id).length > 0) {
                form = $(id);
            } else {
                html = '<form id="' + id + '" class="hide"><input class="hide" type="file" name="file" required="required"/></form>';
                form = $(html).appendTo(prop.jqueryNode);
            }
            form.submit(function () {
                var formdata = new FormData($(this)[0]);
                if (prop.fields) {
                    _.each(prop.fields, function (value, key) {
                        if (typeof value === "object") {
                            var i = 0;
                            _.each(value, function (val, name) {
                                name = key + '[' + name + ']';
                                formdata.append(name, val);
                                i++;
                            });
                        } else {
                            formdata.append(key, value);
                        }
                    });
                }
                $.ajax({
                    url: '/' + prop.route,
                    type: "POST",
                    data: formdata,
                    cache: false,
                    enctype: 'multipart/form-data',
                    processData: false,
                    contentType: false
                }).done(function (response) {
                    if (prop.callback) {
                        prop.callback(response, form);
                    } else {
                        UI.log(response + ', ' + form);
                    }
                }).fail(function (response) {
                    UI.log(response);
                });
                return false;
            });
            form.find('input[type=file]').off().change(function () {
                if ($(this).val() !== '') {
                    return form.submit();
                }
            });
            form.find('input[type=file]').click();
            return true;
        }
    }
};