Arturia Minilab MkII Bitwig Script
==================================

This Bitwig Studio controller script is very simple and does just a few things:
- The left side bank of 8 knobs control the macros of the primary device on
  currently selected track
- Click the knob number 1 to reset all macros to the default value
- Additionally the modulation touch strip controls one of the macros of that
  device (selectable in controller settings)
- The right side bank of 8 knobs are freely assignable in Bitwig

For the script to work you need the default Minilab template BUT you need to
go into the MIDI Control Center and change all the knobs to be "Relative #1".
Only then will the script work properly.
