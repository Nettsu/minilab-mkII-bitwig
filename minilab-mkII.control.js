loadAPI(1);

host.defineController("Arturia", "MiniLab MKII - Netsu", "1.0", "9c891939-9cb5-488d-a447-266f543516f3", "Netsu");
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["Arturia MINILAB MKII"], ["Arturia MINILAB MKII"]);

var TRACK_NUM = 8;
var SEND_NUM = 2;

var MACRO_NAMES = [
    "Macro 1",
    "Macro 2",
    "Macro 3",
    "Macro 4",
    "Macro 5",
    "Macro 6",
    "Macro 7",
    "Macro 8"
];

var MACRO_MAP =
{
    "Macro 1":0,
    "Macro 2":1,
    "Macro 3":2,
    "Macro 4":3,
    "Macro 5":4,
    "Macro 6":5,
    "Macro 7":6,
    "Macro 8":7
};

var Knobs1 = [112, 74, 71, 76, 77, 93, 73, 75];
var Knobs2 = [114, 18, 19, 16, 17, 91, 79, 72];

var Knobs1click = 113;
var Knobs2click = 115;

var modWheel        = 1;
var modWheelMacro   = 7;
var volumeKnobSpeed = 1.0;
var macroKnobSpeed  = 1.0;

function init()
{
    // Create the Note Inputs and their Settings
    MiniLabKeys = host.getMidiInPort(0).createNoteInput("MiniLab Keys", "80????", "90????", "B001??", "B002??", "B007??", "B00B??", "B040??", "C0????", "D0????", "E0????");
    MiniLabKeys.setShouldConsumeEvents(false);
    MiniLabPads = host.getMidiInPort(0).createNoteInput("MiniLab Pads", "?9????");
    MiniLabPads.setShouldConsumeEvents(false);
    MiniLabPads.assignPolyphonicAftertouchToExpression(0, NoteExpression.TIMBRE_UP, 2);

    host.getMidiInPort(0).setMidiCallback(onMidi);
    var prefs = host.getPreferences();

    var modWheelSetting = prefs.getEnumSetting("Modwheel macro", "Modwheel", MACRO_NAMES, "Macro 8");
    modWheelSetting.addValueObserver(function (value) {
        modWheelMacro = MACRO_MAP[value];
    });

    var volumeSpeedSetting = prefs.getNumberSetting("Volume knob speed", "Knobs", -10, 10, 0.1, "", 1.0);
    volumeSpeedSetting.addRawValueObserver(function (value) {
        volumeKnobSpeed = value;
    });

    var macroSpeedSetting = prefs.getNumberSetting("Macro knob speed", "Knobs", -10, 10, 0.1, "", 1.0);
    macroSpeedSetting.addRawValueObserver(function(value) {
        macroKnobSpeed = value;
    });

    // create track bank, groups are added without children
    tracks = host.createMasterTrack(0).createSiblingsTrackBank(TRACK_NUM, SEND_NUM, 0, false, false);
    cTrack = host.createCursorTrack(3, 0);
    cDevice = cTrack.getPrimaryDevice();

    setIndications();
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

    //println(midi.status + ":" + midi.data1 + ":" + midi.data2);

    //status 176 is for knobs I think
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
