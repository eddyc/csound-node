import _ from 'lodash';
import $ from 'jquery';
import LM from 'lmcore2';
import ModelUrls from 'lmmodelurls2';
import Backbone from 'backbone';
import UserConfigDialog from './user-roles/UserConfigDialog';
import SystemMessageCollection from 'commons/logicmonitor2/models/SystemMessageCollection';
import SystemMessageView from 'commons/logicmonitor2/views/SystemMessageView';
import AlertAudioView from 'commons/logicmonitor2/views/alert-view/AlertAudioView';
import Support from 'commons/logicmonitor2/views/support/Support';
import SkilljarRegistrationDialog from 'commons/logicmonitor2/views/SkilljarRegistrationDialog';
import templates from 'commons/logicmonitor2/templates';
import DropDownMenu from 'lmdropdownmenu2';
import utils from 'lmutils2';
import MessageBox from 'lmmsgbox2';
import UrlUtil from 'global-share/utils/UrlUtil';
import UserModel from 'commons/logicmonitor2/models/UserModel';
import 'jquery.cookie';

const getIsV4OpenEditProfile = function() {
    const { searchObject } = UrlUtil.parseURL(location.href);
    return searchObject['openEditProfile'] === 'true';
};

const pagesOutOfBeta = ['alert'];

const overallToggleIsEnable = () => _.result(window, `LMGlobalData.FeatureInfo['uiv4 ${window.LM.currentPage} page']`, false) === true || pagesOutOfBeta.indexOf(window.LM.currentPage) > -1;

export default LM.View.extend({
    inlineHelper: {
        namespace: 'LM Header'
    },

    template: templates['commons/logicmonitor2/TopNavBar'],

    events: {
        'click #lnkTraining': '_onClickTraining',
        'click #lnkSupport': '_onClickPageHeaderSupport',
        'change #overallToggle': '_onClickOverallToggle'
    },

    appEvents: {
        'confirmationEmailSent skilljarTrainingDialog': '_onSkilljarEmailSent',
        'select timezoneMenu': '_updateTimezoneAndRefreshPage'
    },

    initialize: function(options) {
        options = options || {};
        this.userData = options.user;
        this.isFirstAutoOpenProfileFlag = true;
        this.listenTo(this.userData, 'change', this._renderUserInfo);
        this.listenTo(
            Backbone.Events,
            'Global:OpenSupportFromDialog',
            this._openSupportPanel
        );
        this.listenTo(
            Backbone.Events,
            'Global:CloseSupportFromDialog',
            this._closeSupportPanel
        );

        this.listenTo(
            Backbone.Events,
            'Global:SupportIconShouldInactive',
            this._turnSupportIcon2Inactive
        );
        this.listenTo(
            Backbone.Events,
            'Global:SupportIconShouldActive',
            this._turnSupportIcon2Active
        );

        this.listenTo(
            Backbone.Events,
            'Global:companyTimezoneChangedInPortalSetting',
            this._updateTheTimezoneArea
        );

        this.listenTo(
            Backbone.Events,
            'Global:lmSupportUserStatus',
            this.lmSupportUserStatus
        );

        this.setElement(options.el || '#headerbar');
        this.render();
    },

    render: function() {
        var me = this;
        var showTimezoneAlert = !!_.result(window, 'LM.hasErrorForTimezone');
        var timezoneAlertTitle = '';
        var isShowTimezoneArrow = this._canShowTimezoneMenu();

        if (showTimezoneAlert) {
            switch (_.result(window, 'LM.hasErrorForTimezone')) {
                case 'user':
                    timezoneAlertTitle =
                        'Unsupported user time zone (' +
                        _.result(window, 'LM.userTimezone') +
                        '). Please select a valid user time zone for your account.';
                    break;
                default:
                    timezoneAlertTitle = 'Invalid timezone';
            }
        }

        
        this.$el.html(
            this.template({
                showOverallToggle: overallToggleIsEnable(),
                overallToggleStatus: false,
                // isRemoteSupport: lmSupportUserStatus(),
                isTraining:
                    _.result(
                        window,
                        'LMGlobalData.RBAC.supportRBAC.training.canRead'
                    ) &&
                    _.result(
                        window,
                        'LMGlobalData.toggleFeatures.isTrainingEnabled'
                    ),
                isSupport: _.result(
                    window,
                    'LMGlobalData.RBAC.supportRBAC.document.canRead'
                ),
                customHelpLink: _.result(
                    window,
                    'LMGlobalData.userInfo.roles[0].link'
                ),
                username: _.result(
                    window,
                    'LMGlobalData.userInfo.securityUserName'
                ),
                showTimezoneAlert: showTimezoneAlert,
                timezoneAlertIcon: utils.lmicon('icon-alert', 18, 'lightGray', {
                    title: timezoneAlertTitle,
                    'data-placement': 'bottom'
                }),
                isShowTimezoneArrow: isShowTimezoneArrow
            })
        );

        var systemMessage = me.registerComponent(
            'systemMessage',
            new SystemMessageView({
                collection: new SystemMessageCollection()
            }),
            '.header-message-container',
            false
        );
        systemMessage.collection.fetch({
            viewId: me.cid,
            reset: true
        });
        me.registerComponent(
            'alertAudio',
            new AlertAudioView(),
            '.header-audio-container'
        );
        this._updateTheTimezoneArea();
    },
    _onClickOverallToggle: function(e) {
        window.globalBlock.block();
        let enabledNewUI = e.target.checked;
        const key = `${this.userData.id}.alert.alertTable.enabledNewUI`;

        LM.rajaxPromise({
            viewId: this.cid,
            url: ModelUrls.userData({ 
                key
            }),
            type: 'PUT',
            data: JSON.stringify({
                id: key,
                value: enabledNewUI
            })
        }).then(() => {
            if(enabledNewUI) {
                location.href = `/santaba/uiv4/${window.LM.currentPage}`;
            }
        }).catch(utils.handleError)
        .finally(() => window.globalBlock.unBlock());

    },

    _updateTheTimezoneArea: function() {
        var preTimezoneMenuComponent = this.getComponent('timezoneMenu');
        preTimezoneMenuComponent && preTimezoneMenuComponent.remove();
        this.$('#timeZoneContainer')
            .find('.gray-arrow')
            .hide();

        if (this._canShowTimezoneMenu()) {
            var selected;
            var userTimezone = _.result(window, 'LM.userTimezone');
            var companyTimezone = _.result(window, 'LM.companyTimezone');
            var timezoneInUsing = _.result(
                window,
                'LMGlobalData.userInfo.timezoneInUsing'
            ).toLowerCase();
            if (timezoneInUsing === 'company') {
                selected = 'company';
            } else {
                selected = 'user';
            }
            this.$('#timeZoneContainer')
                .find('.gray-arrow')
                .show();

            this.registerComponent(
                'timezoneMenu',
                new DropDownMenu({
                    className: 'lm-menu lm-infomenu timezone-menu',
                    triggerEl: '#timeZoneContainer',
                    template: templates['commons/logicmonitor2/TimezoneMenu'],
                    width: 320,
                    templateData: {
                        selected: selected,
                        userTimezoneDisplayText: utils.getTimezoneDisplayTextObj(
                            userTimezone
                        ).shortName,
                        companyTimezoneDisplayText: utils.getTimezoneDisplayTextObj(
                            companyTimezone
                        ).shortName
                    },
                    offset: {
                        top: 10,
                        left: 0
                    }
                })
            );
        }
        this._showCurrentTimezone(window.LM.displayTimezone);
    },

    _updateTimezoneAndRefreshPage: function(info) {
        var timezoneInUsing = _.result(
            window,
            'LMGlobalData.userInfo.timezoneInUsing'
        ).toLowerCase();
        var id = _.result(window, 'LMGlobalData.userInfo.securityUserId');
        if (info !== timezoneInUsing) {
            LM.rajax({
                doNotNeedViewId: true,
                url:
                    '/santaba/rest/setting/admins/timezone/' +
                    id +
                    '/timezoneInUsing?timezoneInUsing=' +
                    info,
                type: 'put',
                success: function() {
                    window.location.reload();
                },
                error: function(err) {
                    utils.alertAjaxError(err);
                }
            });
        }
    },

    _canShowTimezoneMenu: function() {
        var userTimezone = _.result(window, 'LM.userTimezone');
        var companyTimezone = _.result(window, 'LM.companyTimezone');
        if (
            !_.result(
                window,
                'LMGlobalData.toggleFeatures.isUserTimeZoneEnabled'
            )
        ) {
            return false;
        } else if (!userTimezone || userTimezone === companyTimezone) {
            return false;
        } else if (_.result(window, 'LM.hasErrorForTimezone')) {
            return false;
        } else {
            return true;
        }
    },

    _showCurrentTimezone: function(timezone) {
        timezone = timezone || window.LM.displayTimezone;
        var timezoneDisplayObj = utils.getTimezoneDisplayTextObj(timezone);
        this.$('#timeZone')
            .text(timezoneDisplayObj.shortName)
            .attr('title', timezoneDisplayObj.fullName);
    },

    _renderUserInfo: function() {
        var me = this;
        var userData = me.userData.toJSON();
        var writePermission = LM.RBAC.canWrite(userData.userPermission);
        var NewDropDown = DropDownMenu.extend({
            events: {
                'click #edit-profile-btn': '_onEditProfile',
                'click #lnkLogout': '_signOut'
            },
            _onEditProfile: function() {
                me.registerComponent(
                    'userConfig',
                    new UserConfigDialog({
                        title: 'Manage User',
                        model: me.userData,
                        editType: 'userProfile',
                        footParams: {
                            showFootDelete: false,
                            showFootSave: writePermission
                        }
                    })
                );
            },
            _signOut: function() {
                utils.signOut();
            }
        });

        this.freeChildren('infomenu');
        this.infomenu = new NewDropDown({
            className: 'lm-menu lm-dropdown lm-infomenu',
            triggerEl: '#infoMenuTrigger',
            template: templates['commons/logicmonitor2/InfoMenu'],
            width: 280,
            templateData: {
                email: userData.email,
                showEditLink: writePermission
            },
            offset: {
                top: 20,
                left: 0
            }
        });
        me.registerComponent('infomenu', this.infomenu);

        var supportRBAC = _.result(window, 'LMGlobalData.RBAC.supportRBAC', {});

        var showTraining =
            _.get(supportRBAC, 'training.canRead') &&
            _.get(
                window,
                'LMGlobalData.toggleFeatures.isTrainingEnabled',
                false
            );

        if (showTraining) {
            this.$('#lnkHelp').on('click', function() {
                me._onClickTraining();
            });
        }

        if (getIsV4OpenEditProfile() && this.isFirstAutoOpenProfileFlag) {
            this.isFirstAutoOpenProfileFlag = false;
            this.infomenu.$('#edit-profile-btn').click();
        }

        const fetchLMSupportUser = () => {
            const me = this;
           return LM.rajaxPromise({
               viewId: me.cid,
               url: ModelUrls.users({
                   filter: {
                       username: 'lmsupport'
                   },
                   fields: ['id', 'username', 'roles', 'status']
               })
           });
       };
       
        const lmSupportUserStatus = () => {
           const me = this;
           const supportAccount = _.get(fetchLMSupportUser(), 'data.items', [])[0];
           if (supportAccount) {
               me.lmSupportUserModel = new UserModel(supportAccount);
                   if(supportAccount.roles.length > 0 && supportAccount.status !== 'suspended') {
                       return true;
                   } 
                   else {
                       return false; 
                   }
           }
       
       };
       console.log(lmSupportUserStatus());
    },

    _onClickTraining: function() {
        var me = this;
        var isUserSkilljarRegistered =
            !_.isEmpty(
                _.get(window, 'LMGlobalData.userInfo.trainingEmail', '')
            ) ||
            $.cookie('skilljarEmailConfirmed') ===
                _.get(window, 'LMGlobalData.userInfo.securityUserId', '');

        if (isUserSkilljarRegistered) {
            // Open blank window before we make request to get SSO url to avoid popup blocker
            var skilljarWindow = window.open('', '_blank');
            skilljarWindow.document.write('Please wait...');
            LM.rajax({
                viewId: me.cid,
                url: ModelUrls.skilljarGenerateSsoUrl(),
                type: 'post',
                success: function(res) {
                    skilljarWindow.location.href = res.data;
                },
                error: function(err) {
                    skilljarWindow.close();
                    utils.alertAjaxError(err);
                }
            });
        } else {
            // If user's trainingEmail window variable isn't set and the skilljarConfirm cookie isn't set, there is
            // still a chance the user has already registered in another browser.
            LM.rajax({
                viewId: me.cid,
                url:
                    '/santaba/rest/setting/admins/' +
                    _.result(window, 'LMGlobalData.userInfo.securityUserId'),
                data: {
                    fields: 'trainingEmail'
                },
                success: function(res) {
                    if (.isEmpty(.get(res, 'data.trainingEmail', ''))) {
                        me.registerComponent(
                            'skilljarTrainingDialog',
                            new SkilljarRegistrationDialog({})
                        );
                    } else {
                        // Redirect current page to skilljar to avoid popup blocker (only happens the first time the
                        // user registers) In other cases we will open in new tab
                        LM.rajax({
                            viewId: me.cid,
                            url: ModelUrls.skilljarGenerateSsoUrl(),
                            type: 'post',
                            success: function(res) {
                                window.location.href = res.data;
                            }
                        });
                    }
                }
            });
        }
    },

    _turnSupportIcon2Inactive: function() {
        this.$('#lnkSupport')
            .find('.help-gray')
            .removeClass('active');
    },

    _turnSupportIcon2Active: function() {
        this.$('#lnkSupport')
            .find('.help-gray')
            .addClass('active');
    },

    _onClickPageHeaderSupport: function() {
        var $helpGray = this.$('#lnkSupport').find('.help-gray');

        if ($helpGray.hasClass('active')) {
            this._closeSupportPanel();
        } else {
            this._openSupportPanel();
        }
    },

    _closeSupportPanel: function() {
        this.getComponent('support').closeSupport();
    },

    _openSupportPanel: function(dialogOptions) {
        var support = this.getComponent('support');

        if (support) {
            support.showTheSupport();
        } else {
            if (dialogOptions) {
                this.registerComponent('support', new Support(dialogOptions));
            } else {
                var supportPageKeyWord = window.LMGlobalData.supportKeyWord;
                this.registerComponent(
                    'support',
                    new Support({
                        primitiveQuery: supportPageKeyWord
                    })
                );
            }
        }
    },

    _onSkilljarEmailSent: function(registrationData) {
        this.getComponent('skilljarTrainingDialog').close();
        var msg =
            'A confirmation email was sent to ' + registrationData.email + '.';
        MessageBox.alert(msg, 'Confirmation Email Sent');
    },

    remove: function() {
        clearTimeout(this._timer);
        this._super();
    }
});