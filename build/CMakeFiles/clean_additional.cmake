# Additional clean files
cmake_minimum_required(VERSION 3.16)

if("${CONFIG}" STREQUAL "" OR "${CONFIG}" STREQUAL "")
  file(REMOVE_RECURSE
  "CMakeFiles/HAASP_autogen.dir/AutogenUsed.txt"
  "CMakeFiles/HAASP_autogen.dir/ParseCache.txt"
  "CMakeFiles/HAASPplugin_autogen.dir/AutogenUsed.txt"
  "CMakeFiles/HAASPplugin_autogen.dir/ParseCache.txt"
  "CMakeFiles/haasp_autogen.dir/AutogenUsed.txt"
  "CMakeFiles/haasp_autogen.dir/ParseCache.txt"
  "HAASP_autogen"
  "HAASPplugin_autogen"
  "haasp_autogen"
  )
endif()
