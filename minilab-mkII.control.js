loadAPI(1);

host.defineController("Arturia", "MiniLab MKII - Netsu", "1.0", "9c891939-9cb5-488d-a447-266f543516f3", "Netsu");
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["Arturia MINILAB MKII"], ["Arturia MINILAB MKII"]);

var TRACK_NUM = 8;
var SEND_NUM = 2;

STATUS_PAD_ON = 153;
STATUS_PAD_OFF = 137;
STATUS_KNOB = 176;
FIRST_PAD_MIDI = 36;

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

var COLOR =
{
    BLACK   :"00",
    RED     :"01",
    BLUE    :"10",
    GREEN   :"04",
    CYAN    :"14",
    PURPLE  :"11",
    YELLOW  :"05",
    WHITE   :"7F"
};

var PAD_COLORS =
[
    COLOR.RED,
    COLOR.YELLOW,
    COLOR.YELLOW,
    COLOR.GREEN,
    COLOR.CYAN,
    COLOR.CYAN,
    COLOR.BLUE,
    COLOR.PURPLE,
    COLOR.RED,
    COLOR.YELLOW,
    COLOR.YELLOW,
    COLOR.GREEN,
    COLOR.CYAN,
    COLOR.CYAN,
    COLOR.BLUE,
    COLOR.PURPLE
];

var BOTTOM_FUNC =
{
    CURRENT:0,
    MASTER:1
};

var Knobs1 = [112, 74, 71, 76, 77, 93, 73, 75];
var Knobs2 = [114, 18, 19, 16, 17, 91, 79, 72];

var Knobs1click = 113;
var Knobs2click = 115;

var modWheel        = 1;
var modWheelMacro   = 7;
var volumeKnobSpeed = 1.0;
var macroKnobSpeed  = 1.0;
var rainbowColors   = true;

var bottomRow = BOTTOM_FUNC.CURRENT;

var internalBPM;

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

    var rainbowSetting = prefs.getEnumSetting("Rainbow colors", "Pads", ["ON", "OFF"], "ON");
    rainbowSetting.addValueObserver(function (value) {
        rainbowColors = (value == "ON");
        if (rainbowColors == true)
        {
            makeRainbow();
        }
    });

    var bottomRowSetting = prefs.getEnumSetting("Bottom row", "Knobs", ["Current track", "Master + BPM"], "Current track");
    bottomRowSetting.addValueObserver(function (value) {
        if (value == "Current track")
        {
            bottomRow = BOTTOM_FUNC.CURRENT;
        }
        else
        {
            bottomRow = BOTTOM_FUNC.MASTER;
        }
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
    mDevice = host.createMasterTrack(0).getPrimaryDevice();
    transport = host.createTransport();

    setIndications();
}

function makeRainbow()
{
    for (var i = 0; i < 16; i++)
    {
        setPadColor(i, PAD_COLORS[i]);
    }
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

    if (rainbowColors == true)
    {
        var padNum = midi.data1 - FIRST_PAD_MIDI;
        if (midi.status == STATUS_PAD_ON)
        {
            setPadColor(padNum, COLOR.WHITE);
        }
        if (midi.status == STATUS_PAD_OFF)
        {
            setPadColor(padNum, PAD_COLORS[padNum]);
        }
    }

    //status 176 is for knobs I think
    if (midi.status == STATUS_KNOB)
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
        if (bottomRow == BOTTOM_FUNC.CURRENT)
        {
            cDevice.getMacro(i).getAmount().reset();
        }
        else
        {
            mDevice.getMacro(i).getAmount().reset();
        }
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
        if (bottomRow == BOTTOM_FUNC.CURRENT)
        {
            // 8 macros of selected track
            var inc = (midi.data2 - 64) * macroKnobSpeed;
            cDevice.getMacro(index).getAmount().inc(inc, 128);
        }
        else if (index < 7)
        {
            // 7 macros of master track
            println("master knobs");
            var inc = (midi.data2 - 64) * macroKnobSpeed;
            mDevice.getMacro(index).getAmount().inc(inc, 128);
        }
        else if (index == 7)
        {
            // BPM control
            var sign = getSign(midi.data2 - 64);
            transport.getTempo().incRaw(0.5 * sign);
            //transport.increaseTempo(inc, 256);
        }
    }
}

function setPadColor(pad, color)
{
    var padHex = (112 + pad).toString(16);
    sendSysex("F0 00 20 6B 7F 42 02 00 10 " + padHex + " " + color + " F7");
}

function setIndications()
{
    for (var i = 0; i < 8; i++)
    {
        tracks.getTrack(i).getVolume().setIndication(true);
        cDevice.getMacro(i).getAmount().setIndication(true);
    }
}

function getSign(x)
{
    return typeof x === 'number' ? x ? x < 0 ? -1 : 1 : x === x ? 0 : NaN : NaN;
}

function exit()
{
}
