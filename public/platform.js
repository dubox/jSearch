if(window.navigator.platform.toLowerCase().indexOf('win') > -1 ){
    document.write(`<style>    
    ::-webkit-scrollbar
    {
    width: 0px;
    height: 15px;
    }
    ::-webkit-scrollbar-track:horizontal
    {
        height: 50px;
    background-color: rgba(219, 232, 255,0);
    -webkit-border-radius: 3px;
    }
    ::-webkit-scrollbar-track-piece
    {
    background-color: rgba(219, 232, 255,0);
    -webkit-border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:horizontal
    {
    -webkit-border-radius: 30px;
    background-color: rgba(139, 139, 139,0.3);
    }
    ::-webkit-scrollbar-thumb:horizontal:hover
    {
    background-color: rgba(139, 139, 139,0.5);
    }
    </style>`);
}