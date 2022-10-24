export const secsToDHMS = (secs) => {
    var days = Math.floor(secs / (3600*24));
    secs  -= days*3600*24;
    var hrs   = Math.floor(secs / 3600);
    secs  -= hrs*3600;
    var mins = Math.floor(secs / 60);
    secs  -= mins*60;
    return {
        d: days, 
        h: hrs, 
        m: mins, 
        s: secs,
    }
}