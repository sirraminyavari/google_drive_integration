import React, {Fragment, useState, useEffect} from 'react';
import ListItem from './list.item';
import shortid from 'shortid';
import ContextMenu from "./context.menu";
import GridItem from "./grid.item";
import Checkbox from "./check.box";

const ListView = (props) => {

    const {files, grid} = props;
    const [menuItem, setMenuItem] = useState(files[0])
    const [clientX, setClientX] = useState(0);
    const [clientY, setClientY] = useState(0);
    const [showMenu, setShowMenu] = useState(false);


    const context = (e, file) => {
        e.preventDefault();
        setMenuItem(file);
        setClientX(e.clientX);
        setClientY(e.clientY);
        setShowMenu(true);
    }

    const removeContext = () => {
        setShowMenu(false);
    }

    const openFolder = (file) => {
        props.open(file);
        removeContext();
    }

    const openInNewTab = (file) => {
        const newWindow = window.open(file.webViewLink, '_blank', 'noopener,noreferrer')
        if (newWindow) newWindow.opener = null;
        removeContext();
    }

    const openEmbed = (file) => {
        removeContext();
        props.preview(file);
    }

    const toggleSelect = (status, file) => {
        if (status) {
            props.addToSelected(file);
        } else {
            props.removeFromSelected(file);
        }
    }

    useEffect(() => {

    }, [menuItem]);

    return (

        <Fragment>
            <ContextMenu file={menuItem} clientY={clientY} clientX={clientX}
                         showMenu={showMenu} open={openFolder}
                         openAsEmbed={openEmbed}
                         openInTab={openInNewTab}></ContextMenu>

            {!grid &&
                <div className="list-container">
                    {
                        files.map(x => <div key={shortid.generate()}
                                            onDoubleClick={() => openFolder(x)} onContextMenu={e => context(e, x)}
                                            onClick={() => removeContext()}>
                            <ListItem file={x} select={toggleSelect}></ListItem>
                        </div>)
                    }
                </div>
            }

            {grid &&
            <div className="grid-container">

                {
                    files.map(x => <div key={shortid.generate()} onDoubleClick={() => props.open(x)}
                                        onClick={() => removeContext()}
                                        onContextMenu={e => context(e, x)}>
                        <GridItem file={x} file={x} select={toggleSelect}></GridItem>
                    </div>)
                }
            </div>
            }
        </Fragment>
    )
}

export default ListView;
