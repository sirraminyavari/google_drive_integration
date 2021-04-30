import React, { useEffect, useLayoutEffect, useState } from 'react';
import { gapi } from 'gapi-script';
import {from, Observable, of} from 'rxjs';
import {catchError, switchMap, tap, filter, delay, debounceTime, distinctUntilChanged} from 'rxjs/operators';
import Connect from './connect';
import ListView from './list.view';
import GridView from './grid.view';
import {FIELDS} from "./util";
import styles from './styles.css'
import PathView from "./path.view";



const CLIENT_ID = '1096678200131-3d9slio8q7jroge62pl1jlh01qk5j2v6.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDIDHHwg9oNK-qVFgrqTeJLdipOnMc9rhA';
const SCOPE = `https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.photos.readonly https://www.googleapis.com/auth/drive.readonly`;


// check if is logged in
const checkLogin = () => {
  return gapi.auth2.getAuthInstance().isSignedIn.get();
}

const Main = () => {
    const [query, setQuery] = useState({
        hasMore: true,
        pageToken: '',
        loading: true,
        value: '',
        parent: 'root',
    });
  const [loggedIn, setLoggedIn] = useState(false);
  // const [hasMore, setHasMore] = useState(true);
  // const [pageToken, setPageToken] = useState('');
  // const [loading, setLoading] = useState(false);
  // const [query, setQuery] = useState('');
  // const [parent, setParent] = useState('root');
  const [grid, setGrid] = useState(false);
  const [files, setFiles] = useState([]);
  const [path, setPath] = useState([{name: 'home', id: 'root'}]);

  useEffect(() => {
    gapi.load('client:auth2', () => {
        from(gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            scope: SCOPE
        })).pipe(
            tap(() => {
                setLoggedIn(gapi.auth2.getAuthInstance().isSignedIn.get());
            }),
            filter(() => gapi.auth2.getAuthInstance().isSignedIn && files.length === 0 ),
            switchMap(() => {
                console.log('....')
                return load();
            })
        ).subscribe();
    });
  }, [loggedIn]);

  const load = () => {
      setQuery({...query, loading: true});
      return from(gapi.client.drive.files.list({
          pageSize: 20,
          orderBy: 'folder',
          q: `name contains '${ query.value }' and '${query.parent}' in parents`,
          fields: FIELDS,
          pageToken: query.pageToken
      })).pipe(
          tap(x => {
              console.log(x.result.files);
              const newFiles = files.concat(x.result.files)
              setFiles(newFiles);
              if (x.result.nextPageToken) {
                  setQuery({...query, loading: false, pageToken: x.result.nextPageToken, hasMore: true})
              } else {
                  setQuery({...query, loading: false, hasMore: false})
              }
          }),
          catchError(err => {
              return of(err);
          })
      );
  }

  const next = () => {
      load().subscribe();
  }

  const search = (e) => {
      of(e.target.value)
          .pipe(
              debounceTime(3000),
              distinctUntilChanged(),
              tap(x => {
                  setFiles([]);
                  setQuery({...query, value: x});
              }),
              switchMap(x => load())
          ).subscribe();
  }

  const connect = () => {
    from((async () => {
      return await gapi.auth2.getAuthInstance().signIn({scope: SCOPE });
    })()).pipe(
      tap(() => { console.log('Sign-in successful'); }),
      switchMap(() => {
        return from(gapi.client.load('drive', 'v3')).pipe(
          tap((x) => {
            console.log('load succeed');
            setLoggedIn(checkLogin());
          }),
          catchError(err => {
            console.log(err);
            return of(err);
          })
        );
      })
    ).subscribe();
  }

  const reset = async () => {
      await setFiles([]);
      setQuery({...query, value: '', pageToken: ''}, () => {
          console.log(query);
          load().subscribe();
      });
  }

  const disconnect = () => {
    from(gapi.auth2.getAuthInstance().signOut()).pipe(
      tap(() => {
        console.log('Sign-out successful');
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
      // setPageToken('');
      setFiles([]);
      // setParent(file.id);
      // load().subscribe();
  }

  const navigatePath = async (file) => {
      const fileIndex = path.indexOf(file)
      const newPaths = path.slice(0, fileIndex + 1);
      await setPath(newPaths);
      // await setParent(file.id);
      setQuery({...query, value: '', pageToken: '', parent: file.id});
      // await setPageToken("");
      await setFiles([]);
      // load().subscribe();
  }

  // useEffect(() => {
  //       load().subscribe();
  //       }, [query])

  if(!loggedIn) {
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
                <button className="filter-btn" onClick={() => setGrid(false)}>LIST VIEW</button>
                <button className="filter-btn" onClick={() => setGrid(true)}>GRID VIEW</button>
            </div>
        </div>

        <PathView paths={ path } navigate={navigatePath}></PathView>

      {!grid && <ListView files={files} open={openFolder}></ListView>}

      {grid && <GridView></GridView>}

        {
            !query.loading &&
            <div >
                <button disabled={!query.hasMore}  onClick={() => next()}>LOAD MORE</button>
            </div>
        }

        {
            query.loading &&
            <div > ... loading ...</div>
        }
    </div>
  );
}

export default Main;
