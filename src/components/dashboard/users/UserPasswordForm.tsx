import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, MouseEvent, useCallback, useEffect, useRef } from 'react';
import Dashboard from '../../../utils/dashboard';
import globalize from '../../../scripts/globalize';
import LibraryMenu from '../../../scripts/libraryMenu';
import confirm from '../../confirm/confirm';
import loading from '../../loading/loading';
import toast from '../../toast/toast';
import CheckBoxElement from '../../../elements/CheckBoxElement';
import InputElement from '../../../elements/InputElement';
import Button from '../../../elements/emby-button/Button';

interface UserPasswordFormProps {
    userId: string;
}

const UserPasswordForm: FC<UserPasswordFormProps> = ({ userId }) => {
    const element = useRef<HTMLDivElement>(null);

    const loadUser = useCallback(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        window.ApiClient.getUser(userId).then(function (user) {
            Dashboard.getCurrentUser().then(function (loggedInUser: UserDto) {
                if (!user.Policy) {
                    throw new Error('Unexpected null user.Policy');
                }

                if (!user.Configuration) {
                    throw new Error('Unexpected null user.Configuration');
                }

                LibraryMenu.setTitle(user.Name);

                let showLocalAccessSection = false;

                if (user.HasConfiguredPassword) {
                    (page.querySelector('#btnResetPassword') as HTMLDivElement).classList.remove('hide');
                    (page.querySelector('#fldCurrentPassword') as HTMLDivElement).classList.remove('hide');
                    showLocalAccessSection = true;
                } else {
                    (page.querySelector('#btnResetPassword') as HTMLDivElement).classList.add('hide');
                    (page.querySelector('#fldCurrentPassword') as HTMLDivElement).classList.add('hide');
                }

                if (loggedInUser?.Policy?.IsAdministrator || user.Policy.EnableUserPreferenceAccess) {
                    (page.querySelector('.passwordSection') as HTMLDivElement).classList.remove('hide');
                } else {
                    (page.querySelector('.passwordSection') as HTMLDivElement).classList.add('hide');
                }

                if (showLocalAccessSection && (loggedInUser?.Policy?.IsAdministrator || user.Policy.EnableUserPreferenceAccess)) {
                    (page.querySelector('.localAccessSection') as HTMLDivElement).classList.remove('hide');
                } else {
                    (page.querySelector('.localAccessSection') as HTMLDivElement).classList.add('hide');
                }

                const txtEasyPassword = page.querySelector('#txtEasyPassword') as HTMLInputElement;
                txtEasyPassword.value = '';

                if (user.HasConfiguredEasyPassword) {
                    txtEasyPassword.placeholder = '******';
                    (page.querySelector('#btnResetEasyPassword') as HTMLDivElement).classList.remove('hide');
                } else {
                    txtEasyPassword.removeAttribute('placeholder');
                    txtEasyPassword.placeholder = '';
                    (page.querySelector('#btnResetEasyPassword') as HTMLDivElement).classList.add('hide');
                }

                const chkEnableLocalEasyPassword = page.querySelector('.chkEnableLocalEasyPassword') as HTMLInputElement;

                chkEnableLocalEasyPassword.checked = user.Configuration.EnableLocalPassword || false;

                import('../../autoFocuser').then(({default: autoFocuser}) => {
                    autoFocuser.autoFocus(page);
                });
            });
        });

        (page.querySelector('#txtCurrentPassword') as HTMLInputElement).value = '';
        (page.querySelector('#txtNewPassword') as HTMLInputElement).value = '';
        (page.querySelector('#txtNewPasswordConfirm') as HTMLInputElement).value = '';
    }, [userId]);

    const onSubmit = (e: MouseEvent<HTMLButtonElement>) => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }
        if ((page.querySelector('#txtNewPassword') as HTMLInputElement).value != (page.querySelector('#txtNewPasswordConfirm') as HTMLInputElement).value) {
            toast(globalize.translate('PasswordMatchError'));
        } else {
            loading.show();
            savePassword(page);
        }

        e.preventDefault();
        return false;
    };

    const savePassword = (page: HTMLDivElement) => {
        let currentPassword = (page.querySelector('#txtCurrentPassword') as HTMLInputElement).value;
        const newPassword = (page.querySelector('#txtNewPassword') as HTMLInputElement).value;

        if ((page.querySelector('#fldCurrentPassword') as HTMLDivElement).classList.contains('hide')) {
            // Firefox does not respect autocomplete=off, so clear it if the field is supposed to be hidden (and blank)
            // This should only happen when user.HasConfiguredPassword is false, but this information is not passed on
            currentPassword = '';
        }

        window.ApiClient.updateUserPassword(userId, currentPassword, newPassword).then(function () {
            loading.hide();
            toast(globalize.translate('PasswordSaved'));

            loadUser();
        }, function () {
            loading.hide();
            Dashboard.alert({
                title: globalize.translate('HeaderLoginFailure'),
                message: globalize.translate('MessageInvalidUser')
            });
        });
    };

    const onLocalAccessSubmit = (e: MouseEvent<HTMLButtonElement>) => {
        loading.show();
        saveEasyPassword();
        e.preventDefault();
        return false;
    };

    const saveEasyPassword = () => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }
        const easyPassword = (page.querySelector('#txtEasyPassword') as HTMLInputElement).value;

        if (easyPassword) {
            window.ApiClient.updateEasyPassword(userId, easyPassword).then(function () {
                onEasyPasswordSaved(page);
            });
        } else {
            onEasyPasswordSaved(page);
        }
    };

    const onEasyPasswordSaved = (page: HTMLDivElement) => {
        window.ApiClient.getUser(userId).then(function (user) {
            if (!user.Configuration) {
                throw new Error('Unexpected null user.Configuration');
            }

            if (!user.Id) {
                throw new Error('Unexpected null user.Id');
            }

            user.Configuration.EnableLocalPassword = (page.querySelector('.chkEnableLocalEasyPassword') as HTMLInputElement).checked;
            window.ApiClient.updateUserConfiguration(user.Id, user.Configuration).then(function () {
                loading.hide();
                toast(globalize.translate('SettingsSaved'));

                loadUser();
            });
        });
    };

    const resetEasyPassword = () => {
        const msg = globalize.translate('PinCodeResetConfirmation');

        confirm(msg, globalize.translate('HeaderPinCodeReset')).then(function () {
            loading.show();
            window.ApiClient.resetEasyPassword(userId).then(function () {
                loading.hide();
                Dashboard.alert({
                    message: globalize.translate('PinCodeResetComplete'),
                    title: globalize.translate('HeaderPinCodeReset')
                });
                loadUser();
            });
        });
    };

    const resetPassword = () => {
        const msg = globalize.translate('PasswordResetConfirmation');
        confirm(msg, globalize.translate('ResetPassword')).then(function () {
            loading.show();
            window.ApiClient.resetUserPassword(userId).then(function () {
                loading.hide();
                Dashboard.alert({
                    message: globalize.translate('PasswordResetComplete'),
                    title: globalize.translate('ResetPassword')
                });
                loadUser();
            });
        });
    };

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    return (
        <div ref={element}>
            <form
                className='updatePasswordForm passwordSection hide'
                style={{margin: '0 auto 2em'}}
            >
                <div className='detailSection'>
                    <div id='fldCurrentPassword' className='inputContainer hide'>
                        <InputElement
                            type='password'
                            id='txtCurrentPassword'
                            label='LabelCurrentPassword'
                            options={'autoComplete="off"'}
                        />
                    </div>
                    <div className='inputContainer'>
                        <InputElement
                            type='password'
                            id='txtNewPassword'
                            label='LabelNewPassword'
                            options={'autoComplete="off"'}
                        />
                    </div>
                    <div className='inputContainer'>
                        <InputElement
                            type='password'
                            id='txtNewPasswordConfirm'
                            label='LabelNewPasswordConfirm'
                            options={'autoComplete="off"'}
                        />
                    </div>
                    <br />
                    <div>
                        <Button
                            type='submit'
                            className='raised button-submit block'
                            title='Save'
                            onClick={onSubmit}
                        />
                        <Button
                            type='button'
                            id='btnResetPassword'
                            className='raised button-cancel block hide'
                            title='ResetPassword'
                            onClick={resetPassword}
                        />
                    </div>
                </div>
            </form>
            <br />
            <form
                className='localAccessForm localAccessSection'
                style={{margin: '0 auto'}}
            >
                <div className='detailSection'>
                    <div className='detailSectionHeader'>
                        {globalize.translate('HeaderEasyPinCode')}
                    </div>
                    <br />
                    <div>
                        {globalize.translate('EasyPasswordHelp')}
                    </div>
                    <br />
                    <div className='inputContainer'>
                        <InputElement
                            type='number'
                            id='txtEasyPassword'
                            label='LabelEasyPinCode'
                            options={'autoComplete="off" pattern="[0-9]*" step="1" maxlength="5"'}
                        />
                    </div>
                    <br />
                    <div className='checkboxContainer checkboxContainer-withDescription'>
                        <CheckBoxElement
                            className='chkEnableLocalEasyPassword'
                            title='LabelInNetworkSignInWithEasyPassword'
                        />
                        <div className='fieldDescription checkboxFieldDescription'>
                            {globalize.translate('LabelInNetworkSignInWithEasyPasswordHelp')}
                        </div>
                    </div>
                    <div>
                        <Button
                            type='submit'
                            className='raised button-submit block'
                            title='Save'
                            onClick={onLocalAccessSubmit}
                        />
                        <Button
                            type='button'
                            id='btnResetEasyPassword'
                            className='raised button-cancel block hide'
                            title='ButtonResetEasyPassword'
                            onClick={resetEasyPassword}
                        />
                    </div>
                </div>
            </form>
        </div>
    );
};

export default UserPasswordForm;
