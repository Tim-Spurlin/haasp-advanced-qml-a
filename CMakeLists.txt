cmake_minimum_required(VERSION 3.28)
project(HAASP LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(CMAKE_AUTOMOC ON)

# Find necessary Qt packages
find_package(Qt6 REQUIRED COMPONENTS Core Gui Qml Quick QuickControls2)

# Add the QML resource file
qt_add_qml_module(HAASP
    URI "HAASP"
    VERSION "1.0"
    QML_FILES
        ui/main.qml
    RESOURCES
        ui/qml.qrc
)

# Add the C++ source file
add_executable(haasp
    engine/main.cpp
)

# Link against the Qt libraries
target_link_libraries(haasp PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Qml
    Qt6::Quick
    Qt6::QuickControls2
)

# Link the QML module
target_link_libraries(haasp PRIVATE HAASP)