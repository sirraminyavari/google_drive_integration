import React, {Fragment, useState} from 'react';
import ListItem from './list.item';
import shortid from 'shortid';
import ContextMenu from "./context.menu";
import GridItem from "./grid.item";

const ListView = (props) => {

    const {files, grid} = props;

    /*
        components states:
        menuItem: selected item for context menu
        clientX: x coordination of mouse click
        clientY: y coordination of mouse click
        showMenu: toggle context menu state 
    */
    const [menuItem, setMenuItem] = useState(files[0])
    const [clientX, setClientX] = useState(0);
    const [clientY, setClientY] = useState(0);
    const [showMenu, setShowMenu] = useState(false);


    //  open context menu
    const context = (e, file) => {
        e.preventDefault();
        setMenuItem(file);
        setClientX(e.clientX);
        setClientY(e.clientY);
        setShowMenu(true);
    }

    //  close context menu
    const removeContext = () => {
        setShowMenu(false);
    }

    //  close context menu and run openFolder() function fron parent component
    const openFolder = (file) => {
        props.open(file);
        removeContext();
    }

    //  open file in new tab and close context menu
    const openInNewTab = (file) => {
        const newWindow = window.open(file.webViewLink, '_blank', 'noopener,noreferrer')
        if (newWindow) newWindow.opener = null;
        removeContext();
    }

    //  open file in embed component
    const openEmbed = (file) => {
        removeContext();
        props.preview(file);
    }

    //  toggle checkbox of a file
    const toggleSelect = (status, file) => {
        if (status) {
            props.addToSelected(file);
        } else {
            props.removeFromSelected(file);
        }
    }

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
                        <GridItem file={x} select={toggleSelect}></GridItem>
                    </div>)
                }
            </div>
            }
        </Fragment>
    )
}

export default ListView;
