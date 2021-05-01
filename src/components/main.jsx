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


const CLIENT_ID = '1096678200131-3d9slio8q7jroge62pl1jlh01qk5j2v6.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDIDHHwg9oNK-qVFgrqTeJLdipOnMc9rhA';
const SCOPE = `https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.photos.readonly https://www.googleapis.com/auth/drive.readonly`;


// check if is logged in
const checkLogin = () => {
    return gapi.auth2.getAuthInstance().isSignedIn.get();
}

const Main = (props) => {

    const [loggedIn, setLoggedIn] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [pageToken, setPageToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [grid, setGrid] = useState(false);
    const [files, setFiles] = useState([]);
    const [path, setPath] = useState([{name: 'home', id: 'root'}]);
    const [query, setQuery] = useState({
        pageToken: '',
        value: '',
        parent: 'root',
    });

    const [embed, setEmbed] = useState({ status: false, url: ''})

    useLayoutEffect(() => {
        console.log('loading...')
        gapi.load('client:auth2', () => {
            from(gapi.client.init({
                apiKey: API_KEY,
                clientId: CLIENT_ID,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                scope: SCOPE
            })).pipe(
                tap(() => {
                    console.log('loading done!')
                    setLoggedIn(gapi.auth2.getAuthInstance().isSignedIn.get());
                })
            ).subscribe();
        });
    }, [loggedIn]);

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

    const next = () => {
        setQuery({...query, pageToken});
    }

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

    const connect = () => {
        from((async () => {
            return await gapi.auth2.getAuthInstance().signIn({scope: SCOPE});
        })()).pipe(
            switchMap(() => {
                return from(gapi.client.load('drive', 'v3')).pipe(
                    tap((x) => {
                        setLoggedIn(checkLogin());
                    }),
                    catchError(err => {
                        return of(err);
                    })
                );
            })
        ).subscribe();
    }

    const reset = async () => {
        await setFiles([]);
        setQuery({...query, value: '', pageToken: ''});
    }

    const disconnect = () => {
        from(gapi.auth2.getAuthInstance().signOut()).pipe(
            tap(() => {
                setLoggedIn(checkLogin());
            }),
        ).subscribe();
    }

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
                    className="disconnect-btn"
                    onClick={() => disconnect()}>
                    DISCONNECT
                </button>
            </div>

            <div className="search-box">
                <input className="search-field" type="text" placeholder="Search" onChange={e => search(e)}/>
            </div>
            <div className="search-box">
                <div className="filter-box">
                    <button className="filter-btn" onClick={() => reset()}>RESET SEARCH</button>
                    <div style={{flexGrow: 4}}></div>
                    <button className={grid ? 'filter-btn' : 'selected'}
                            onClick={() => setGrid(false)}>LIST VIEW
                    </button>
                    <button className={!grid ? 'filter-btn' : 'selected'}
                            onClick={() => setGrid(true)}>GRID VIEW
                    </button>
                </div>
            </div>

            <PathView paths={path} navigate={navigatePath}></PathView>

            <ListView files={files} open={openFolder} preview={openEmbed} grid={grid}></ListView>


            {
                !loading &&
                <div style={{display: (!hasMore) ? 'none' : 'block'}}>
                    <button onClick={() => next()}>LOAD MORE</button>
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
