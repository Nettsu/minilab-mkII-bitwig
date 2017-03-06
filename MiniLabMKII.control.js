
loadAPI(1);

host.defineController("Arturia", "MiniLab mkII - Netsu", "1.0", "6E55D132-1846-4C64-9F97-48041F2D9B96");
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["Arturia MINILAB MKII"], ["Arturia MINILAB MKII"]);

var TRACK_NUM = 8;

var Knobs1 = [112, 74, 71, 76, 77, 93, 73, 75];
var Knobs2 = [114, 18, 19, 16, 17, 91, 79, 72];

var Knobs1click = 113;
var Knobs2click = 115;

var modWheel = 1;
var modWheelMacro = 7;

var volumeKnobSpeed = 1.0;
var macroKnobSpeed = 2.0;

function init()
{
    // Create the Note Inputs and their Settings
    MiniLabKeys = host.getMidiInPort(0).createNoteInput("MiniLab Keys", "80????", "90????", "B001??", "B002??", "B007??", "B00B??", "B040??", "C0????", "D0????", "E0????");
    MiniLabKeys.setShouldConsumeEvents(false);
    MiniLabPads = host.getMidiInPort(0).createNoteInput("MiniLab Pads", "?9????");
    MiniLabPads.setShouldConsumeEvents(false);
    MiniLabPads.assignPolyphonicAftertouchToExpression(0, NoteExpression.TIMBRE_UP, 2);

    host.getMidiInPort(0).setMidiCallback(onMidi);
    host.getMidiInPort(0).setSysexCallback(onSysex);

    transport = host.createTransport();

    // create track bank, groups are added without children
    tracks = host.createMasterTrack(0).createSiblingsTrackBank(TRACK_NUM, 2, 0, false, false);
    cTrack = host.createCursorTrack(3, 0);
    cDevice = cTrack.getPrimaryDevice();

    for (var i = 0; i < TRACK_NUM; i++)
    {
        tracks.getChannel(i).getVolume().addRawValueObserver(function(value) {
           // limit value to <= 0 ??
        })
    }

    // Make CCs 1-119 freely mappable
    //userControls = host.createUserControls(HIGHEST_CC - LOWEST_CC + 1);

    setIndications();

    //for(var i=LOWEST_CC; i<=HIGHEST_CC; i++)
    //{
    //    userControls.getControl(i - LOWEST_CC).setLabel("CC" + i);
    //}
}

function MidiData(status, data1, data2)
{
   this.status = status;
   this.data1 = data1;
   this.data2 = data2;
}

function onMidi(status, data1, data2)
{
    // Instantiate the MidiData Object for convenience:
    var midi = new MidiData(status, data1, data2);

    //if (midi.data1 == 0 && midi.status != 176)
    //{
        println(midi.status + ":" + midi.data1 + ":" + midi.data2);
    //}

    // status 176 is for knobs I think
    if (midi.status == 176)
    {
        for (var i = 0; i < 8; i++)
        {
           if (midi.data1 === Knobs1[i])
           {
              knobFunc(1, i, midi);
           }
           else if (midi.data1 === Knobs2[i])
           {
              knobFunc(2, i, midi);
           }
        }

        if (midi.data1 == Knobs1click)
        {
            resetVolumes();
        }
        else if (midi.data1 == Knobs2click)
        {
            resetMacros();
        }
        else if (midi.data1 == modWheel)
        {
            modWheelFunc(midi);
        }
    }
}

function resetVolumes()
{
    for (var i = 0; i < TRACK_NUM; i++)
    {
        tracks.getTrack(i).getVolume().reset();
    }
}

function resetMacros()
{
    for (var i = 0; i < 8; i++)
    {
        cDevice.getMacro(i).getAmount().reset();
    }
}

function modWheelFunc(midi)
{
    cDevice.getMacro(modWheelMacro).getAmount().set(midi.data2, 128);
}

function knobFunc(Row, index, midi)
{
    if (Row === 1)
    {
        var inc = (midi.data2 - 64) * volumeKnobSpeed;
        tracks.getChannel(index).getVolume().inc(inc, 128);
    }
    else
    {
        var inc = (midi.data2 - 64) * macroKnobSpeed;
        cDevice.getMacro(index).getAmount().inc(inc, 128);
    }
}

function onSysex(data) {
   // MMC Transport Controls:
   switch (data) {
      case "f07f7f0605f7":
         transport.rewind();
         break;
      case "f07f7f0604f7":
         transport.fastForward();
         break;
      case "f07f7f0601f7":
         transport.stop();
         break;
      case "f07f7f0602f7":
         transport.play();
         break;
      case "f07f7f0606f7":
         transport.record();
         break;
   }
}

function setIndications()
{
    for (var i = 0; i < 8; i++)
    {
        tracks.getTrack(i).getVolume().setIndication(true);
        cDevice.getMacro(i).getAmount().setIndication(true);
    }
}


function exit()
{
}
