import React from 'react';

const EmbedFilePreview = React.memo(({ url, close }) => {
    return (
        <div className="embed-file-container">
            <div>
                <embed title='file-preview'
                       target='_top'
                       className="embed-file-wrapper"
                       src={`${url}&output=embed`}></embed>
            </div>
            <div className="fab" onClick={() => close()}>&#10005;</div>
        </div>
    )
});
export default EmbedFilePreview;
