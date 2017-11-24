var t, handle;
self.onmessage = function(e){

    console.log('TWERK     !!');
    if (e.data.type === "startCanvasTimer") {
        let cycle = e.data.cycle;
        let resolution = e.data.resolution;
        

        console.log('TWERK1!!', t, cycle, resolution);

        handle = setInterval(function(){ 
            let samples = e.data.samples
            let item_x = parseInt(t, 10);
            for(let a = 0; a < samples.length; a++) {
              for(let b = 0; b < samples[a].n.length; b++) {
                if (samples[a].n[b].time[item_x] && samples[a].n[b].time[item_x].executed === false) {
                    
                    samples[a].n[b].time[item_x].executed = true;
                    
                    let s = "";
                    for(var key in samples[a].n[b].time[item_x]) {
                        if(samples[a].n[b].time[item_x].hasOwnProperty(key)) {
                            if(key !== "s" && key !== "n" && key !== "executed" &&
                                key !== "cps" && key !== "delta" && key !== "cycle" && key !== "time")
                                s += key+":"+samples[a].n[b].time[item_x][key]+",";
                        }
                    }
                
                    let pattern = "sound: \"" + samples[a].s + ":"+ samples[a].n[b].no +"\"";
                
                    postMessage({type: "sendPattern", pattern: "~d1.(("+s+ pattern +"));"});
            
                }
              }
            }
            
            postMessage({type: "seq", time: t++%(cycle*resolution)});
        }, (cycle*1000)/(cycle*resolution))
    }
    else if(e.data.type === "resetCanvasTimer") {
        console.log('TWERK2!!', handle, '##', t);
        
        t = 0;
        clearInterval(handle);
        postMessage({type: "seq", time: 0});
    }

}