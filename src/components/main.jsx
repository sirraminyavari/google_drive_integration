import React, {useEffect, useLayoutEffect, useState} from 'react';
import {gapi} from 'gapi-script';
import {from, Observable, of} from 'rxjs';
import {catchError, switchMap, tap, debounceTime, distinctUntilChanged} from 'rxjs/operators';
import Connect from './connect';
import ListView from './list.view';
import {FIELDS} from "./util";
import styles from './styles.css'
import PathView from "./path.view";
import EmbedFilePreview from "./embed.file.preview";


/* *******************************************************
             GOOGLE DRIVE PROJECT CREDENTIALS
 **********************************************************/
const CLIENT_ID = '1096678200131-3d9slio8q7jroge62pl1jlh01qk5j2v6.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDIDHHwg9oNK-qVFgrqTeJLdipOnMc9rhA';
const SCOPE = `https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.photos.readonly https://www.googleapis.com/auth/drive.readonly`;



/* *******************************************************
                  INITIAL STATE OBJECTS
 **********************************************************/
const initQuery = {pageToken: '', value: '', parent: 'root'};
const initPath = [{name: 'home', id: 'root'}];
const initEmbed = { status: false, url: ''};

export const SelectedFileContext = React.createContext([]);

const Main = (props) => {

    const [loggedIn, setLoggedIn] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [pageToken, setPageToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [grid, setGrid] = useState(false);
    const [files, setFiles] = useState([]);
    const [path, setPath] = useState(initPath);
    const [query, setQuery] = useState(initQuery);
    const [embed, setEmbed] = useState(initEmbed)
    const [selected, setSelected] = useState([]);


    /*
     *  LOAD GOOGLE API PLATFORM INTERFACE
     */
    useLayoutEffect(() => {
        gapi.load('client:auth2', () => {
            from(gapi.client.init({
                apiKey: API_KEY,
                clientId: CLIENT_ID,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                scope: SCOPE
            })).pipe(
                tap(() => setLoggedIn(gapi.auth2.getAuthInstance().isSignedIn.get()))
            ).subscribe();
        });
    }, [loggedIn]);


    /*
     *  API CALL METHOD USING RXJS
     */
    const load = () => {
        if (!gapi.client) return of();

        setLoading(true);
        return from(gapi.client.drive.files.list({
            pageSize: 20,
            orderBy: 'folder',
            q: `name contains '${query.value}' and '${query.parent}' in parents`,
            fields: FIELDS,
            pageToken: query.pageToken
        })).pipe(
            tap(x => {
                const newFiles = files.concat(x.result.files)
                setFiles(newFiles);
                setLoading(false);
                if (x.result.nextPageToken) {
                    setPageToken(x.result.nextPageToken);
                    setHasMore(true)
                } else {
                    setHasMore(false)
                }
            }),
            catchError(err => {
                return of(err);
            })
        );
    }


    /*
     *  LOAD MORE ITEMS FORM API METHOD
     */
    const next = () => {
        setQuery({...query, pageToken});
    }


    /*
     *  LOAD ITEMS BASED ON SEARCH FIELD FORM API METHOD
     */
    const search = (e) => {
        of(e.target.value)
            .pipe(
                debounceTime(3000),
                distinctUntilChanged(),
                tap(value => {
                    setFiles([]);
                    setQuery({...query, value});
                }),
                // switchMap(x => load())
            ).subscribe();
    }



    /*
     *  CONNECT TO GOOGLE DRIVE API
     */
    const connect = () => {
        from((async () => {
            return await gapi.auth2.getAuthInstance().signIn({scope: SCOPE});
        })()).pipe(
            switchMap(() => {
                return from(gapi.client.load('drive', 'v3')).pipe(
                    tap((x) => {
                        setLoggedIn(gapi.auth2.getAuthInstance().isSignedIn.get());
                    }),
                    catchError(err => {
                        return of(err);
                    })
                );
            })
        ).subscribe();
    }


    /*
     *  DISCONNECT FROM GOOGLE DRIVE API
     */
    const disconnect = () => {
        from(gapi.auth2.getAuthInstance().signOut()).pipe(
            tap(() => {
                setLoggedIn(gapi.auth2.getAuthInstance().isSignedIn.get());
            }),
        ).subscribe();
    }


    /*
     *  RESET SEARCH RESULTS
     */
    const reset = async () => {
        await setFiles([]);
        setQuery({...query, value: '', pageToken: ''});
    }


    /*
     *  OPEN FOLDER TYPE ITEMS AND LOAD FOLDER FILES
     */
    const openFolder = (file) => {
        if (file.mimeType !== 'application/vnd.google-apps.folder') {
            return;
        }
        setPath([...path, {name: file.name, id: file.id}])
        setQuery({...query, value: '', pageToken: '', parent: file.id});
        setFiles([]);
    }

    const navigatePath = async (file) => {
        const fileIndex = path.indexOf(file)
        const newPaths = path.slice(0, fileIndex + 1);
        setFiles([]);
        setPath(newPaths);
        setQuery({...query, value: '', pageToken: '', parent: file.id});
    }

    const closeEmbed = () => {
        setEmbed({...embed, status: false});
    }

    const openEmbed = (file) => {
        setEmbed({status: true, url: file.webViewLink });
    }

    const addToSelected = (file) => {
        const exist = selected.find(x => x.id === file.id);
        if (!exist) {
            setSelected([...selected, file]);
        }
    }

    const removeFromSelected = (file) => {
        const removed = selected.filter(x => x.id !== file.id);
        setSelected(removed);
    }

    const flushSelectedFiles = () => {
        setSelected([]);
    }

    const insert = () => {
        props.selected(selected)
       // setSelected([]);
    }

    useEffect(() => {
        load().subscribe();
    }, [query, loggedIn])

    useEffect(() => {

    }, [grid]);

    if (!loggedIn) {
        return <Connect connect={() => connect()}></Connect>
    }


    return (
        <div className="wrapper">
            <div className="disconnect-box">
                <button
                    disabled={selected.length === 0}
                    className="insert-btn"
                    onClick={() => insert()}>
                    INSERT
                </button>
                <button
                    disabled={selected.length === 0}
                    className="insert-btn"
                    onClick={() => flushSelectedFiles()}>
                    CANCEL
                </button>

                <div style={{flexGrow: 3}}></div>

                <button
                    className="disconnect-btn"
                    onClick={() => disconnect()}>
                    DISCONNECT
                </button>
            </div>

            <div className="search-box">
                <div>
                    <input className="search-field" type="text" placeholder="Search" onChange={e => search(e)}/>
                </div>
            </div>
            <div className="search-box">
                <div className="filter-box">
                    <button className="filter-btn" onClick={() => reset()}>RESET SEARCH</button>
                    <div style={{flexGrow: 4}}></div>
                    <button className={grid ? 'filter-btn' : 'selected'}
                            onClick={() => setGrid(false)}>LIST
                    </button>
                    <button className={!grid ? 'filter-btn' : 'selected'}
                            onClick={() => setGrid(true)}>GRID
                    </button>
                </div>
            </div>

            <PathView paths={path} navigate={navigatePath}></PathView>

            <SelectedFileContext.Provider value={selected}>
                <ListView files={files}
                          open={openFolder}
                          preview={openEmbed}
                          grid={grid} addToSelected={addToSelected}
                          removeFromSelected={removeFromSelected}></ListView>
            </SelectedFileContext.Provider>


            {
                !loading &&
                <div style={{display: (!hasMore) ? 'none' : 'block'}}>
                    <button onClick={() => next()} className="load-more-btn">LOAD MORE</button>
                </div>
            }

            {
                loading &&
                <div> ... loading ...</div>
            }

            {embed.status && <EmbedFilePreview close={closeEmbed} url={embed.url}></EmbedFilePreview>}
        </div>
    );
}

export default Main;
