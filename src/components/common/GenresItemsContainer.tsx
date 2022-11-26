import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, useCallback, useEffect, useState } from 'react';
import GenresSectionContainer from '../../components/common/GenresSectionContainer';
import loading from '../../components/loading/loading';
import ServerConnections from '../../components/ServerConnections';
import globalize from '../../scripts/globalize';

interface GenresItemsContainerProps {
    topParentId: string | null;
    getItemTypes: () => string[];
    getNoItemsMessage?: () => string;
}

const GenresItemsContainer: FC<GenresItemsContainerProps> = ({ topParentId, getItemTypes }) => {
    const [ genresItems, setGenresItems ] = useState<BaseItemDto[]>([]);

    const fetchData = useCallback(() => {
        loading.show();

        const apiClient = ServerConnections.getApiClient(window.ApiClient.serverId());
        return apiClient.getGenres(
            apiClient.getCurrentUserId(),
            {
                SortBy: 'SortName',
                SortOrder: 'Ascending',
                IncludeItemTypes: getItemTypes().join(','),
                Recursive: true,
                EnableTotalRecordCount: false,
                ParentId: topParentId
            }
        );
    }, [getItemTypes, topParentId]);

    const loadGenres = useCallback(() => {
        fetchData().then((result) => {
            setGenresItems(result.Items || []);
            loading.hide();
        });
    }, [fetchData]);

    useEffect(() => {
        loadGenres();
    }, [loadGenres]);

    return (
        <>
            {
                !genresItems.length ?
                    (
                        <div className='noItemsMessage centerMessage'>
                            <h1>{globalize.translate('MessageNothingHere')}</h1>
                            <p>{globalize.translate('MessageNoGenresAvailable')}</p>
                        </div>
                    ) : genresItems.map((genre, index) => (
                        <GenresSectionContainer
                            key={index}
                            topParentId={topParentId}
                            getItemTypes={getItemTypes}
                            genre={genre}
                        />
                    ))
            }
        </>
    );
};

export default GenresItemsContainer;
