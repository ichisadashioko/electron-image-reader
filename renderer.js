const fs = require('fs');
const path = require('path');

const userdata_dir = path.join(__dirname, 'userdata');
const saved_path_list = path.join(userdata_dir, 'path_list.txt');

var listing_lock = {};

const IMAGE_EXTENSION_LIST = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'bmp',
    'webp',
    'svg',
    'tiff',
    'tif',
    'ico',
];

function get_saved_path_list() {
    if (!fs.existsSync(saved_path_list)) {
        return [];
    }

    let content_str = fs.readFileSync(saved_path_list, 'utf8');
    let lines = content_str.split('\n');
    let path_list = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        line = line.trim();

        if (line.length > 0) {
            path_list.push(line);
        }
    }

    return path_list;
}

function generate_child_file_entry_dom_node(
    filepath,
    file_name,
    dirent_obj,
) {
    let container = document.createElement('div');

    let file_type_icon = document.createElement('i');
    file_type_icon.classList.add('bi');
    file_type_icon.classList.add('file_type_icon');

    if (dirent_obj.isDirectory()) {
        file_type_icon.classList.add('bi-folder');
        container.classList.add('filetype_directory');
    } else if (dirent_obj.isFile()) {
        file_type_icon.classList.add('bi-file-earmark');
        container.classList.add('filetype_regular_file');
    } else if (dirent_obj.isSymbolicLink()) {
        file_type_icon.classList.add('bi-folder-symlink');
        container.classList.add('filetype_symbolic_link');
    }
    else {
        file_type_icon.classList.add('bi-file-earmark-x');
        container.classList.add('filetype_unknown');
    }

    let file_name_holder = document.createElement('p');
    file_name_holder.classList.add('file-name-holder');
    file_name_holder.textContent = file_name;
    file_name_holder.addEventListener('click', function (evt) {
        on_file_name_click(
            evt,
            container,
            filepath,
        );
    });

    container.appendChild(file_type_icon);
    container.appendChild(file_name_holder);

    return container;
}

/**
 * @param {MouseEvent} evt
 * @param {HTMLElement} container_dom_node
 * @param {string} filepath
 */
function on_file_name_click(
    evt,
    container_dom_node,
    filepath,
) {
    console.debug(evt);
    if (container_dom_node.lock != null) {
        console.log('on_file_name_click: container_dom_node.lock != null');
        console.log(arguments);
        console.log(container_dom_node);
        // TODO log message
        return;
    }

    container_dom_node.lock = true;
    let is_lock_passed = false;

    try {
        let file_stat = fs.statSync(filepath);

        if (file_stat.isDirectory()) {
            if (listing_lock[filepath] != null) {
                console.log(`${filepath} listing is locked`);
            } else {
                try {
                    listing_lock[filepath] = true;
                    is_lock_passed = true;

                    fs.readdir(
                        filepath,
                        {
                            withFileTypes: true,
                            encoding: 'utf8',
                        },
                        function (err, dirent_array) {
                            listing_lock[filepath] = null;

                            if (err != null) {
                                console.error(`fs.readdir ${filepath} error`);
                                console.error(err);
                                container_dom_node.lock = null;
                                return;
                            }

                            // TODO customize sorting
                            // TODO store selected sorting method for each directory

                            let child_file_entry_dom_nodes = [];
                            // TODO show empty directory indicator
                            for (let i = 0; i < dirent_array.length; i++) {
                                let dirent_obj = dirent_array[i];
                                let child_filepath = path.join(filepath, dirent_obj.name);

                                let child_file_entry_dom_node = generate_child_file_entry_dom_node(
                                    child_filepath,
                                    dirent_obj.name,
                                    dirent_obj,
                                );

                                child_file_entry_dom_nodes.push(child_file_entry_dom_node);
                            }

                            let children_container = container_dom_node.getElementsByClassName('children_container')[0];
                            container_dom_node.children
                            if (children_container == null) {
                                // console.log('children_container is null');
                                children_container = document.createElement('div');
                                children_container.className = 'children_container';

                                container_dom_node.appendChild(children_container);
                            }

                            children_container.innerHTML = '';
                            for (let i = 0; i < child_file_entry_dom_nodes.length; i++) {
                                children_container.appendChild(child_file_entry_dom_nodes[i]);
                            }

                            container_dom_node.lock = null;
                        }
                    )
                } catch (listing_error) {
                    console.error(`${filepath} listing error`);
                    console.error(listing_error);
                }
            }
        } else if (file_stat.isFile()) {
            let file_extension = path.extname(filepath);
            if (file_extension.length < 1) {
                console.log(`${filepath} does not have extension indicator in file name`);
            } else {
                file_extension = file_extension.substring(1).toLowerCase();
                if (IMAGE_EXTENSION_LIST.indexOf(file_extension) < 0) {
                    console.log(`${filepath} is not a supported image file type`);
                } else {
                    // TODO handle lazy loading in array of images
                    let image_panel = document.getElementById('image_panel');
                    if (image_panel == null) {
                        console.error('image_panel is null');
                    } else {
                        if (image_panel.lock == null) {
                            image_panel.lock = true;

                            image_panel.replaceChildren();

                            let image_dom_node = document.createElement('img');
                            image_panel.appendChild(image_dom_node);

                            setTimeout(function () {
                                // TODO uri encode each file name in path
                                image_dom_node.src = filepath;
                            }, 0);

                            image_panel.lock = null;
                        } else {
                            console.log('image_panel.lock != null');
                            console.log(image_panel);
                        }
                    }
                }
            }
        } else {
            console.error(`unhandled file type: ${filepath}`);
        }
    } catch (error) {
        console.error(error);
    }

    if (!is_lock_passed) {
        container_dom_node.lock = null;
    }
}

let user_saved_path_list = get_saved_path_list();

let GLOBAL_USER_SAVED_PATH_DICT = {};

for (let i = 0; i < user_saved_path_list.length; i++) {
    let path_str = user_saved_path_list[i];

    let is_path_still_exist = fs.existsSync(path_str);

    GLOBAL_USER_SAVED_PATH_DICT[path_str] = {
        expanded: false,
        children: [],
        exist: is_path_still_exist,
        listing: false,
    };
}

let user_saved_path_list_container = document.getElementById('pathlist');

if (user_saved_path_list_container == null) {
    console.log('user_saved_path_list_container is null');
} else {
    for (let i = 0; i < user_saved_path_list.length; i++) {
        let path_str = user_saved_path_list[i];

        let icon_element = document.createElement('i');
        icon_element.className = 'bi bi-file-earmark-x';
        let file_name_holder = document.createElement('p');
        file_name_holder.className = 'file-name-holder';
        file_name_holder.textContent = path_str;

        let path_div = document.createElement('div');
        path_div.appendChild(icon_element);
        path_div.appendChild(file_name_holder);
        // path_div.innerHTML = path_str;
        file_name_holder.addEventListener('click', function (evt) {
            on_file_name_click(
                evt,
                path_div,
                path_str,
            );
        });

        user_saved_path_list_container.appendChild(path_div);
    }
}

/**********************************************************************/
var toggle_file_browsing_key_down = false;
const TOGGLE_FILE_BROWSING_KEY_CODE = 'F1';

var toggle_image_rendering_configuration_panel_key_down = false;
const TOGGLE_IMAGE_RENDERING_CONFIGURATION_PANEL_KEY_CODE = 'F3';

document.addEventListener('keydown', function (evt) {
    if (evt.defaultPrevented) {
        console.debug(evt);
        return;
    }

    console.debug(`keydown - code ${evt.code} - key ${evt.key}`);

    if (evt.key === TOGGLE_FILE_BROWSING_KEY_CODE) {
        evt.preventDefault();

        if (toggle_file_browsing_key_down) {
            console.debug(`${evt.key} is not released!`);
            return;
        }

        toggle_file_browsing_key_down = true;
        let file_browsing_panel = document.getElementById('pathlist');
        if (file_browsing_panel == null) {
            console.error('file_browsing_panel == null');
        } else {
            if (file_browsing_panel.style.display === 'none') {
                file_browsing_panel.style.display = null;
            } else {
                file_browsing_panel.style.display = 'none';
            }
        }
    } else if (evt.key === TOGGLE_IMAGE_RENDERING_CONFIGURATION_PANEL_KEY_CODE) {
        evt.preventDefault();

        if (toggle_image_rendering_configuration_panel_key_down) {
            console.debug(`${evt.key} is not released!`);
            return;
        }

        toggle_image_rendering_configuration_panel_key_down = true;
        let image_rendering_configuration_panel = document.getElementById('image_rendering_configuration');
        if (image_rendering_configuration_panel == null) {
            console.error('image_rendering_configuration_panel == null');
        } else {
            if (image_rendering_configuration_panel.style.display === 'none') {
                image_rendering_configuration_panel.style.display = null;
            } else {
                image_rendering_configuration_panel.style.display = 'none';
            }
        }
    }
});

document.addEventListener('keyup', function (evt) {
    if (evt.defaultPrevented) {
        console.debug(evt);
        return;
    }

    console.debug(`keyup - code ${evt.code} - key ${evt.key}`);

    if (evt.key === TOGGLE_FILE_BROWSING_KEY_CODE) {
        evt.preventDefault();
        toggle_file_browsing_key_down = false;
    } else if (evt.key === TOGGLE_IMAGE_RENDERING_CONFIGURATION_PANEL_KEY_CODE) {
        evt.preventDefault();
        toggle_image_rendering_configuration_panel_key_down = false;
    }
});

/**********************************************************************/
var image_rendering_configuration_panel = document.getElementById('image_rendering_configuration');
if (image_rendering_configuration_panel == null) {
    console.error('image_rendering_configuration_panel == null');
} else {

    /**********************************************************************/
    image_rendering_configuration_panel.addEventListener('mousedown', function (evt) {
        if (evt.defaultPrevented) {
            console.debug(evt);
            return;
        }

        // check if the mouse down is on child element of the panel
        console.debug(evt.target);
        if (evt.target == null) { return; }
        if (evt.target.classList == null) { return; }
        if (!evt.target.classList.contains('grabbable')) { return; }

        evt.preventDefault();
        image_rendering_configuration_panel.grabbed = {
            offsetx: image_rendering_configuration_panel.offsetLeft - evt.clientX,
            offsety: image_rendering_configuration_panel.offsetTop - evt.clientY,
        };
    });

    /**********************************************************************/
    document.addEventListener('mousemove', function (evt) {
        if (evt.defaultPrevented) { return; }

        if (image_rendering_configuration_panel.grabbed == null) { return; }

        // console.debug(`buttons ${evt.buttons} - clientX ${evt.clientX} - clientY ${evt.clientY}`);

        let isLeftButtonStillDown = (evt.buttons & 1) === 1;

        if (!isLeftButtonStillDown) {
            image_rendering_configuration_panel.grabbed = null;
            return;
        }

        evt.preventDefault();

        let new_x = evt.clientX + image_rendering_configuration_panel.grabbed.offsetx;
        let new_y = evt.clientY + image_rendering_configuration_panel.grabbed.offsety;
        image_rendering_configuration_panel.style.top = `${new_y}px`;
        image_rendering_configuration_panel.style.left = `${new_x}px`;
    });
}

const IMAGE_RENDERING_CONFIGURATION_ORIGINAL = 0;
const IMAGE_RENDERING_CONFIGURATION_FIT_HEIGHT = 1;
const IMAGE_RENDERING_CONFIGURATION_FIT_WIDTH = 2;
const IMAGE_RENDERING_CONFIGURATION_AUTO_FIT = 3;

var CURRENT_IMAGE_RENDERING_CONFIGURATION = IMAGE_RENDERING_CONFIGURATION_ORIGINAL;

/**
 * @param {number} image_rendering_configuration_style
 * @param {HTMLImageElement} image_dom
 * @param {HTMLElement} image_container_dom
 */
function change_image_rendering_style(
    image_rendering_configuration_style,
    image_dom,
    image_container_dom,
) {
    if (image_rendering_configuration_style === IMAGE_RENDERING_CONFIGURATION_ORIGINAL) {
        if (image_dom.style.width !== '') {
            image_dom.style.width = '';
        }

        if (image_dom.style.height !== '') {
            image_dom.style.height = '';
        }
    } else if (image_rendering_configuration_style === IMAGE_RENDERING_CONFIGURATION_FIT_HEIGHT) {
        if (image_dom.style.width !== '') {
            image_dom.style.width = '';
        }

        if (image_dom.style.height !== '100%') {
            image_dom.style.height = '100%';
        }

        // TODO hide the scrollbar if the current image width is smaller than the image container width
    } else if (image_rendering_configuration_style === IMAGE_RENDERING_CONFIGURATION_FIT_WIDTH) {
        if (image_dom.style.width !== '100%') {
            image_dom.style.width = '100%';
        }

        if (image_dom.style.height !== '') {
            image_dom.style.height = '';
        }
    } else {
        console.error(`unsupported image_rendering_configuration_style - ${image_rendering_configuration_style}`);
    }
}

function on_image_rendering_configuration_change() {
    // single image
    let image_panel = document.getElementById('image_panel');
    if (image_panel == null) {
        console.error('image_panel == null');
    } else {
        let image_dom_array = image_panel.getElementsByTagName('img');
        // TODO handle multiple images
        if (image_dom_array.length > 0) {
            change_image_rendering_style(
                CURRENT_IMAGE_RENDERING_CONFIGURATION,
                image_dom_array[0],
                image_panel,
            );
        } else {
            console.error('image_dom_array.length == 0');
        }
    }
}

var image_rendering_configuration_original_size_radio_button = document.getElementById('image_size_original');
if (image_rendering_configuration_original_size_radio_button == null) {
    console.error('image_rendering_configuration_original_size_radio_button == null');
} else {
    image_rendering_configuration_original_size_radio_button.addEventListener('click', function (evt) {
        if (evt.defaultPrevented) { return; }

        CURRENT_IMAGE_RENDERING_CONFIGURATION = IMAGE_RENDERING_CONFIGURATION_ORIGINAL;
        on_image_rendering_configuration_change();
    });
}

var image_rendering_configuration_fit_height_radio_button = document.getElementById('image_size_fit_height');
if (image_rendering_configuration_fit_height_radio_button == null) {
    console.error('image_rendering_configuration_fit_height_radio_button == null');
} else {
    image_rendering_configuration_fit_height_radio_button.addEventListener('click', function (evt) {
        if (evt.defaultPrevented) { return; }

        CURRENT_IMAGE_RENDERING_CONFIGURATION = IMAGE_RENDERING_CONFIGURATION_FIT_HEIGHT;
        on_image_rendering_configuration_change();
    });
}

var image_rendering_configuration_fit_width_radio_button = document.getElementById('image_size_fit_width');
if (image_rendering_configuration_fit_width_radio_button == null) {
    console.error('image_rendering_configuration_fit_width_radio_button == null');
} else {
    image_rendering_configuration_fit_width_radio_button.addEventListener('click', function (evt) {
        if (evt.defaultPrevented) { return; }

        CURRENT_IMAGE_RENDERING_CONFIGURATION = IMAGE_RENDERING_CONFIGURATION_FIT_WIDTH;
        on_image_rendering_configuration_change();
    });
}
