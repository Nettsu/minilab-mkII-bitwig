loadAPI(1);

host.defineController("Arturia", "MiniLab MKII", "1.0", "9c891939-9cb5-488d-a447-266f543516f3", "Netsu");
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["Arturia MINILAB MKII"], ["Arturia MINILAB MKII"]);

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

var PAD_FUNCTION =
{
	NOTES:0,
	CONTROL:1
};

var KnobsLeft = [112, 74, 71, 76, 114, 18, 19, 16];
var KnobsRight = [77, 93, 73, 75, 17, 91, 79, 72];

var Knob1click = 113;
var Knob9click = 115;

var modWheel        = 1;
var modWheelMacro   = 7;
var macroKnobSpeed  = 1.0;
var rainbowColors   = true;
var padFunction 	= PAD_FUNCTION.NOTES;

function init()
{
    // Create the Note Inputs and their Settings
    MiniLabKeys = host.getMidiInPort(0).createNoteInput("MiniLab Keys", "80????", "90????", "B001??", "B002??", "B007??", "B00B??", "B040??", "C0????", "D0????", "E0????");
    MiniLabKeys.setShouldConsumeEvents(false);
    MiniLabPads = host.getMidiInPort(0).createNoteInput("MiniLab Pads", "?9????");
    MiniLabPads.setShouldConsumeEvents(false);
    MiniLabPads.assignPolyphonicAftertouchToExpression(0, NoteExpression.TIMBRE_UP, 2);

    host.getMidiInPort(0).setMidiCallback(onMidi);

	transport = host.createTransport();
    cTrack = host.createCursorTrack(3, 0);
    uControl = host.createUserControls(8);
    cDevice = cTrack.getPrimaryDevice();
    prefs = host.getPreferences();

    for (var i = 0; i < 8; i++)
    {
        uControl.getControl(i).setLabel("CC " + KnobsRight[i])
    }

    var modWheelSetting = prefs.getEnumSetting("Modwheel macro", "Modwheel", MACRO_NAMES, "Macro 8");
    modWheelSetting.addValueObserver(function (value)
    {
        modWheelMacro = MACRO_MAP[value];
    });

    var macroSpeedSetting = prefs.getNumberSetting("Macro knob speed", "Knobs", -10, 10, 0.1, "", 1.0);
    macroSpeedSetting.addRawValueObserver(function(value)
    {
        macroKnobSpeed = value;
    });

    var rainbowSetting = prefs.getEnumSetting("Rainbow colors", "Pads", ["ON", "OFF"], "ON");
    rainbowSetting.addValueObserver(function (value)
    {
        rainbowColors = (value == "ON");
        if (rainbowColors == true)
        {
            makeRainbow();
        }
    });
    
    var padSetting = prefs.getEnumSetting("Pad function", "Pads", ["Notes", "Control"], "Notes");
    padSetting.addValueObserver(function (value)
    {
        if (value == "Notes")
        {
			padFunction = PAD_FUNCTION.NOTES;
		}
		else
		{
			padFunction = PAD_FUNCTION.CONTROL;
		}
    });

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

function onPad(status, data1, data2)
{
	if (midi.status == STATUS_PAD_ON)
	{
		var padNum = midi.data1 - FIRST_PAD_MIDI;
		
		if (padFunction == PAD_FUNCTION.CONTROL)
		{
			if (padNum == 4)
			{
				transport.togglePlay();
			}
			else if (padNum == 5)
			{
				transport.stop();
			}
			else if (padNum == 6)
			{
				transport.record();
			}
		}
		
		if (rainbowColors == true)
		{
			setPadColor(padNum, COLOR.WHITE);
		}
	}
	else if (midi.status == STATUS_PAD_OFF)
	{
		var padNum = midi.data1 - FIRST_PAD_MIDI;
		
		if (rainbowColors == true)
		{
			setPadColor(padNum, PAD_COLORS[padNum]);
		}
    }
}

function onMidi(status, data1, data2)
{
    // Instantiate the MidiData Object for convenience:
    var midi = new MidiData(status, data1, data2);

    //println(midi.status + ":" + midi.data1 + ":" + midi.data2);
	if (midi.status == STATUS_PAD_ON || midi.status == STATUS_PAD_OFF)
	{
		onPad(status, data1, data2);
	}

    if (midi.status == STATUS_KNOB)
    {
        var inc = (midi.data2 - 64) * macroKnobSpeed;

        for (var i = 0; i < 8; i++)
        {
           if (midi.data1 === KnobsLeft[i])
           {
               cDevice.getMacro(i).getAmount().inc(inc, 128);
           }
           else if (midi.data1 === KnobsRight[i])
           {
              uControl.getControl(i).inc(inc, 128);
           }
        }

        if (midi.data1 == Knob1click)
        {
            resetMacros();
        }
        else if (midi.data1 == modWheel)
        {
            modWheelFunc(midi);
        }
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

function setPadColor(pad, color)
{
    var padHex = (112 + pad).toString(16);
    sendSysex("F0 00 20 6B 7F 42 02 00 10 " + padHex + " " + color + " F7");
}

function setIndications()
{
    for (var i = 0; i < 8; i++)
    {
        cDevice.getMacro(i).getAmount().setIndication(true);
        uControl.getControl(i).setIndication(true);
    }
}

function getSign(x)
{
    return typeof x === 'number' ? x ? x < 0 ? -1 : 1 : x === x ? 0 : NaN : NaN;
}

function exit()
{
}
