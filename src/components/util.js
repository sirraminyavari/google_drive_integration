import * as moment from 'moment-timezone';
import * as jalali from 'jalali-moment';

export const localDate = (d) => {
    return jalali(d).locale('fa').format('YYYY/MM/DD');
};

export const localTime = (d) => {
    return moment(d).locale('fa-IR').utc(true).tz('Asia/Tehran').format('HH:mm');
};


export const FIELDS = `nextPageToken, files(id, name, mimeType, modifiedTime, thumbnailLink, iconLink, size, webContentLink, webViewLink, webContentLink, hasThumbnail, originalFilename, fullFileExtension, parents, hasThumbnail, folderColorRgb)`
