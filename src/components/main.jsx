import React, {useEffect, useLayoutEffect, useState} from 'react';
import {gapi} from 'gapi-script';
import {from, of} from 'rxjs';
import {catchError, switchMap, tap, debounceTime, distinctUntilChanged, first } from 'rxjs/operators';
import Connect from './connect';
import ListView from './list.view';
import {FIELDS} from "./util";
import './styles.css'
import PathView from "./path.view";
import EmbedFilePreview from "./embed.file.preview";
import ErrorPage from "./error.page";


    /* *
        GOOGLE DRIVE PROJECT CREDENTIALS
            client id: read about it in https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid
            api key: https://developers.google.com/maps/documentation/javascript/get-api-key
            scope: determine which access level do you have


    */
const CLIENT_ID = '1096678200131-3d9slio8q7jroge62pl1jlh01qk5j2v6.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDIDHHwg9oNK-qVFgrqTeJLdipOnMc9rhA';
const SCOPE = `https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.photos.readonly https://www.googleapis.com/auth/drive.readonly`;



    /* *
        INITIAL STATE OBJECTS

            initQuery: initial state for querying data from api

            initPath: initial state of current directory to view

            initEmbed: embed is layout overlay component to open file. initialEmbed is this initial state which toggle
                view of this layout overlay component.
     */
const initQuery = {pageToken: '', value: '', parent: 'root'};
const initPath = [{name: 'root', id: 'root'}];
const initEmbed = { status: false, url: ''};
const fetchDataErrorInit = { status: false, message: null, code: 0}

    //  use context api to pass selected files to child components
export const SelectedFileContext = React.createContext([]);

const Main = (props) => {

    /*
        States of the app:
            loggedIn: login status,

            hasMore: this state determines whether there are files left to fetch or not

            pageToken: next page token!! (google drive api style of handling pagination. when there is no page left to fetch, api returns "undefined")

            loading: loader state during fetch data from api

            gird: grid view status, true set file structure as grid

            files: current state of google files

            path: current directory path

            query: query state to filtering api call

            embed: layout overlay component state to open file in <iframe> tag. 

            selected: current state of selected files.
            
            fetchDataError: a flag to preveiw error component when error happening through api call.

     */
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
    const [fetchDataError, setFetchDataError] = useState(fetchDataErrorInit);


    /*
     *  LOAD GOOGLE API PLATFORM INTERFACE
            this method load google api platform api which include persistent data (logged state in local storage) out of the box.
            when the load completed loggedIn state resolved in rxjs pipe. 
     */
    useLayoutEffect(() => {
        gapi.load('client:auth2', () => {
            from(gapi.client.init({
                apiKey: API_KEY,
                clientId: CLIENT_ID,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                scope: SCOPE
            })).pipe(
                first(),
                tap(() => setLoggedIn(gapi.auth2.getAuthInstance().isSignedIn.get()))
            ).subscribe();
        });
        return () => { }
    }, [loggedIn]);


    /*
     *  API CALL METHOD USING RXJS
            this method is the gateway to gdrive api. It uses rxjs observable to handle http call.
     */
    const load = () => {

        // check if google api platform is not loaded yet.
        if (!gapi.client) return of();

        setLoading(true);
        return from(gapi.client.drive.files.list({
            pageSize: 20,
            orderBy: 'folder',
            q: `name contains '${query.value}' and '${query.parent}' in parents`,
            fields: FIELDS,
            pageToken: query.pageToken
        })).pipe(
            first(),
            tap(x => {
                const newFiles = files.concat(x.result.files)
                setFiles(newFiles);
                setLoading(false);
                console.log(newFiles)
                if (x.result.nextPageToken) {
                    // nextPageToken is not undefined which is mean there is left data to fetch 
                    setPageToken(x.result.nextPageToken);
                    setHasMore(true)
                } else {
                    setHasMore(false)
                }
            }),
            catchError(err => {
                setFetchDataError({
                    status: true,
                    message: err.result.error.message,
                    code: err.result.error.code
                });
                return of(err);
            })
        );
    }


    /*
     *  CONNECT TO GOOGLE DRIVE API
            start connection to google drive api and update loggedIn state
     */
    const connect = () => {
        from((async () => {
            return await gapi.auth2.getAuthInstance().signIn({scope: SCOPE});
        })()).pipe(
            switchMap(() => {
                 return from(gapi.client.load('drive', 'v3')).pipe(
                    first(),
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
     *  LOAD MORE ITEMS FORM API METHOD
            fetch next page 
     */
    const next = () => {
        setQuery({...query, pageToken});
    }


    /*
     *  LOAD ITEMS BASED ON SEARCH FIELD FORM API METHOD
            this method triggers when something is typed in searched feild. It uses rxjs to handle autocomplete functionality.
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
            ).subscribe();
    }


    /*
     *  RESET SEARCH RESULTS
     */
    const reset = () => {
        setFiles([]);
        setQuery({...query, value: '', pageToken: ''});
    }


    /*
     *  OPEN FOLDER TYPE ITEMS AND LOAD FOLDER FILES
            this method triggers when an item clicked. when the item type is folder the path state to this folder.
     */
    const openFolder = (file) => {
        if (file.mimeType !== 'application/vnd.google-apps.folder') {
            return;
        }
        flushSelectedFiles();
        setPath([...path, {name: file.name, id: file.id}])
        setQuery({...query, value: '', pageToken: '', parent: file.id});
        setFiles([]);
    }

    /*
    *   CHANGE PATH STATE 
            this method triggers when path item clicked. it will change the current folder to that folder.
    */

    const navigatePath = async (file) => {
        const fileIndex = path.indexOf(file)
        const newPaths = path.slice(0, fileIndex + 1);
        setFiles([]);
        setPath(newPaths);
        flushSelectedFiles();
        setQuery({...query, value: '', pageToken: '', parent: file.id});
    }

    /*
    *   OPEN EMBEDED FILE PREVIEW
    */
    const closeEmbed = () => {
        setEmbed({...embed, status: false});
    }


    /*
    *   CLOSE EMBEDED FILE PREVIEW
    */
    const openEmbed = (file) => {
        setEmbed({status: true, url: file.webViewLink });
    }

    /*
    *   ADD FILE TO SELECTED FILES
    */
    const addToSelected = (file) => {
        const exist = selected.find(x => x.id === file.id);
        if (!exist) {
            setSelected([...selected, file]);
        }
    }

    /*
    *   REMOVE ITEM FROM SELECTED FILES
    */
    const removeFromSelected = (file) => {
        const removed = selected.filter(x => x.id !== file.id);
        setSelected(removed);
    }

    /*
    *   EMPTY SELECTED FILES ARRAY
    */
    const flushSelectedFiles = () => {
        setSelected([]);
    }

    /*
    *   PASS SELECTED FILES TO PARENT COMPONENT
    */
    const insert = () => {
        props.selected(selected)
    }

    /*
    *   TRIGGER load() FUNCTION ON query or loggedIn VALUE CHANGES 
    */
    useEffect(() => {

        const load$ = load().subscribe();

        return () => { load$.unsubscribe(); }
    }, [query, loggedIn])


    const returnToHome = () => {
        setFetchDataError(fetchDataErrorInit);
        setPath(initPath);
        load().subscribe();
    }



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


            {/* search feild */}
            <div className="search-box">
                <div>
                    <input className="search-field"
                           value={query.value}
                           type="text"
                           placeholder="Search"
                           onChange={e => search(e)}/>
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

            { !fetchDataError.status &&
            <SelectedFileContext.Provider value={selected}>
                <ListView files={files}
                          open={openFolder}
                          preview={openEmbed}
                          grid={grid} addToSelected={addToSelected}
                          removeFromSelected={removeFromSelected}>
                </ListView>
            </SelectedFileContext.Provider>
            }

            {
                !loading && !fetchDataError.status &&
                <div style={{display: (!hasMore) ? 'none' : 'block'}}>
                    <button onClick={() => next()} className="load-more-btn">LOAD MORE</button>
                </div>
            }

            {
                loading && !fetchDataError.status &&
                <div> ... loading ...</div>
            }

            {embed.status && <EmbedFilePreview close={closeEmbed} url={embed.url} api={gapi}></EmbedFilePreview>}

            {fetchDataError.status && <ErrorPage error={fetchDataError}
                                                 back={returnToHome}
                                                 reload={reset}></ErrorPage>}
        </div>
    );
}

export default Main;
