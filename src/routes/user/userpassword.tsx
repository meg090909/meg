import React, { FC, useEffect, useState } from 'react';
import SectionTabs from '../../components/dashboard/users/SectionTabs';
import UserPasswordForm from '../../components/dashboard/users/UserPasswordForm';
import SectionTitleContainer from '../../elements/SectionTitleContainer';
import Page from '../../components/Page';
import loading from '../../components/loading/loading';
import { useSearchParams } from 'react-router-dom';

const UserPassword: FC = () => {
    const [ searchParams ] = useSearchParams();
    const userId = searchParams.get('userId') || '';
    const [ userName, setUserName ] = useState('');

    useEffect(() => {
        const loadUser = () => {
            loading.show();
            window.ApiClient.getUser(userId).then(function (user) {
                if (!user.Name) {
                    throw new Error('Unexpected null user.Name');
                }
                setUserName(user.Name);
                loading.hide();
            });
        };
        loadUser();
    }, [userId]);

    return (
        <Page
            id='userPasswordPage'
            className='mainAnimatedPage type-interior userPasswordPage'
        >
            <div className='content-primary'>
                <div className='verticalSection'>
                    <SectionTitleContainer
                        title={userName}
                        url='https://jellyfin.org/docs/general/server/users/'
                    />
                </div>
                <SectionTabs activeTab='userpassword'/>
                <div className='readOnlyContent'>
                    <UserPasswordForm
                        userId={userId}
                    />
                </div>
            </div>
        </Page>

    );
};

export default UserPassword;
