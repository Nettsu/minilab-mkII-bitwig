Arturia Minilab MkII Bitwig Script
==================================

This Bitwig Studio controller script is very simple and does just a few things:
- The top row of knobs control the volume of the first 8 tracks
  (tracks inside groups are ignored for this purpose)
- The bottom row of knobs control the macros of the primary device on currently
  selected track
- Additionally the modulation touch strip controls the 8th macro of that device

For the script to work you need the default Minilab template BUT you need to
go into the MIDI Control Center and change all the knobs to be "Relative #1".
Only then will the script work properly.
