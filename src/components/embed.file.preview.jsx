import React from 'react';

const EmbedFilePreview = ({ url, close }) => {
    return (
        <div className="embed-file-container">
            <div >
                <iframe className="embed-file-wrapper" src={url} frameborder="0"></iframe>
            </div>
            <div className="fab" onClick={() => close()}>&#10005;</div>
        </div>
    )
}
export default EmbedFilePreview;
