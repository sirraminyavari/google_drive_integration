import React, {useEffect, useState} from 'react';


const EmbedFilePreview = React.memo(({url, close}) => {

    const [modifiedUrl, setModifiedUrl] = useState('');
    useEffect(() => {

        const index = url.lastIndexOf('/') + 1;
        setModifiedUrl(`${url.substr(0, index)}/preview`);


        return () => {
        }
    }, [modifiedUrl])
    return (
        <div className="embed-file-container">

            {modifiedUrl !== '' &&
            <div className="embed-file-wrapper">
                <embed title='file-preview'
                       target='_top'
                       className="embed-file-wrapper"
                       src={`${modifiedUrl}?embedded=true`}></embed>
            </div>
            }
            <div className="fab" onClick={() => close()}>&#10005;</div>
        </div>
    )
});
export default EmbedFilePreview;
