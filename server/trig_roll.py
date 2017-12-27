## This script triggers pattern rolls on the sequencer of Siren.
## incoming data format:
##  -- roll_name, roll_note, start, stop, speed, orbit, loopCount

import sys, os, time, json, numpy as np

from pythonosc import osc_message_builder
from pythonosc import udp_client
from pythonosc.udp_client import SimpleUDPClient

osc_udp_client = None
current_milli_time = lambda: int(round(time.time() * 1000))
osc_udp_client = SimpleUDPClient("127.0.0.1", 57120)

def imap(value, istart, istop, ostart, ostop):
    return int(ostart + (ostop - ostart) * ((value - istart) / (istop - istart)))
    
def sendSCMessage(m):
    cycle = "cycle"
    delta = "delta"
    cps = "cps"
    n = "n"
    s = "s"
    orbit = "orbit"
    osc_udp_client.send_message("/play2", [cycle, m['cycle'], delta, m['delta'], cps, 1, s , m['s'], n, m['n'], orbit, m['orbit']])

def constructTimeline(roll):
    timelength = roll['end']*roll['resolution']
    timeline = [None] * timelength

    for message in roll['messages']:
        timeline[message['t_index']] = message
    
    return timeline

def loadJSON(name, number = 0):
    saves = [filename for filename in os.listdir("./server/processing/export/") if name in filename and os.path.isdir(filename) == False]
    if saves:
        jsondata = json.load( open("./server/processing/export/" + saves[number % len(saves)]) )
        return jsondata

#Read data from stdin
def read_in():
    lines = sys.stdin.readlines()
    
    #Since our input would only be having one line, parse our JSON data from that
    return json.loads(lines[0])

def main():
    #get our data as an array from read_in()
    lines = read_in()

    #parameters
    roll_name  = lines[0]
    roll_note  = lines[1]
    roll_start = lines[2]
    roll_stop  = lines[3]
    roll_speed = lines[4]
    roll_loop  = lines[5]
    
    print(roll_name, roll_note, roll_start, roll_stop, roll_speed, roll_loop)

    jsondata = loadJSON(roll_name, roll_note)
    if jsondata is None:
        print(current_milli_time(), "could not find, exiting...")
        exit
    else:
        timeline = constructTimeline(jsondata)
        
        startTime = current_milli_time()
        current_timestamp = -1
        while startTime + jsondata['end']*1000 > current_milli_time():
            elapsed_time = current_milli_time() - startTime

            timestamp_location = imap(elapsed_time, 
                                     0, jsondata['end']*1000, 
                                     0, jsondata['end']*jsondata['resolution'])
            if (timestamp_location > current_timestamp and 
                timestamp_location < jsondata['end']*jsondata['resolution']):
                current_timestamp = timestamp_location

                if  timeline[current_timestamp] is not None:
                    sendSCMessage(timeline[current_timestamp])

#start process
if __name__ == '__main__':
    main()