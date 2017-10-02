Arturia Minilab MkII Bitwig Script
==================================

Knobs:
- The left side bank of 8 knobs control the remote controls of currently
  selected device
- Click the knob number 1 to reset all macros to the default value
- Additionally the modulation touch strip controls one of the controls of that
  device (selectable in controller settings)
- The right side bank of 8 knobs are freely assignable in Bitwig

Pads can change function depending on configuration in Bitwig:
- Note mode: the pads will send regular midi notes to Bitwig
- Control mode: the pads will control transport and scrolling:
	- pad 1 and 2 scroll throgh the devices in currently selected device chain
	- pad 3 and 4 scroll though the remote control pages
	- pad 5, 6 and 7 control play, stop and global record respectively

For the script to work you need the default Minilab template BUT you need to
go into the MIDI Control Center and change all the knobs to be "Relative #1".
Only then will the script work properly.
