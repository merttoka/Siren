self.onmessage = function(e){
    let samples = e.data.samples;
    let a = e.data.a;
    let b = e.data.b;
    let item_x = e.data.x;
    
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

    postMessage({type: "sendPatternTwerk", pattern: "~d1.(("+s+ pattern +"));"});
}