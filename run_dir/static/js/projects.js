/*
File: projects.js
URL: /static/js/projects.js
Powers /projects/[List type] - template is run_dir/design/projects.html
*/

// Get pseudo-argument for this js file. projects = 'pending' | 'ongoing' | ...
var projects_page_type = $('#projects-js').attr('data-projects');

var begin = new Date(2012,0, 1);
var end = new Date();

$('#projectFilterDate').on('shown.bs.modal', function () {
 $("#OpenDateSlider").dateRangeSlider('resize');
 $("#QueueDateSlider").dateRangeSlider('resize');
 $("#CloseDateSlider").dateRangeSlider('resize');
})

// On page load
$(function(){

  //load the sliders
  $(".dateSlider").dateRangeSlider({
    range: true,
    bounds:{
      min: begin,
      max: end,
    },
    defaultValues:{
        min: begin,
        max: end,
    }
  });

  // Load the presets first (to get the table headers)
  $.when(load_presets()).done(function(){
    // Show the page
    $('#loading_spinner').hide();
    $('#page_content').show();
  });

  // Prevent traditional html submit function
  $('#Search-form').submit(function(event){event.preventDefault();});

  // Listen to project meta button
  $('#compare_projects_meta_btn').click(function(e){
    e.preventDefault();
    var pids = Array();
    $('#project_table tbody tr td.project').each(function(){
      pids.push($(this).text());
    });
    var meta_go = true;
    if(pids.length > 800){
      meta_go = confirm('Are you sure? You have '+pids.length+' projects visible - comparing this many projects will almost certainly crash your browser and may cause the end of the known universe..');
    } else if(pids.length > 400){
      meta_go = confirm('Are you sure? You have '+pids.length+' projects visible - comparing this many projects will probably crash your browser..');
    } else if(pids.length > 100){
      meta_go = confirm('Are you sure? You have '+pids.length+' projects visible - this is going to take a long time...');
    } else if(pids.length == 0){
      alert('Error - no projects currently visible.');
      meta_go = false;
    }
    if(meta_go){
      window.location.href = '/proj_meta?p='+pids.join('&p=');
    }
  });

});


// Load the Projects Table
function load_table() {
  // Get the columns and write the table header
  columns = read_current_filtering();
  load_table_head(columns);

  // Display the loading spinner in the table
  $("#project_table_body").html('<tr><td colspan="'+columns.length+'" class="text-muted"><span class="glyphicon glyphicon-refresh glyphicon-spin"></span> <em>Loading..</em></td></tr>');

    url="/api/v1/projects?list=" + projects_page_type;
    // Date filtering
    if ($("#OpenDateSlider").dateRangeSlider("values").min !==$("#OpenDateSlider").dateRangeSlider("bounds").min ||
       $("#OpenDateSlider").dateRangeSlider("values").max !==$("#OpenDateSlider").dateRangeSlider("bounds").max ){
        old_open_date=$("#OpenDateSlider").dateRangeSlider("values").min.getFullYear()+'-'+('0'+($("#OpenDateSlider").dateRangeSlider("values").min.getMonth()+1)).slice(-2)+'-'+('0'+$("#OpenDateSlider").dateRangeSlider("values").min.getDate()).slice(-2);
        new_open_date=$("#OpenDateSlider").dateRangeSlider("values").max.getFullYear()+'-'+('0'+($("#OpenDateSlider").dateRangeSlider("values").max.getMonth()+1)).slice(-2)+'-'+('0'+$("#OpenDateSlider").dateRangeSlider("values").max.getDate()).slice(-2);
        url=url+"&oldest_open_date="+old_open_date+"&youngest_open_date="+new_open_date;
       }
    if ($("#QueueDateSlider").dateRangeSlider("values").min !==$("#QueueDateSlider").dateRangeSlider("bounds").min ||
       $("#QueueDateSlider").dateRangeSlider("values").max !==$("#QueueDateSlider").dateRangeSlider("bounds").max ){
        old_queue_date=$("#QueueDateSlider").dateRangeSlider("values").min.getFullYear()+'-'+('0'+($("#QueueDateSlider").dateRangeSlider("values").min.getMonth()+1)).slice(-2)+'-'+('0'+$("#QueueDateSlider").dateRangeSlider("values").min.getDate()).slice(-2);
        new_queue_date=$("#QueueDateSlider").dateRangeSlider("values").max.getFullYear()+'-'+('0'+($("#QueueDateSlider").dateRangeSlider("values").max.getMonth()+1)).slice(-2)+'-'+('0'+$("#QueueDateSlider").dateRangeSlider("values").max.getDate()).slice(-2);
        url=url+"&oldest_queue_date="+old_queue_date+"&youngest_queue_date="+new_queue_date;
       }
    if ($("#CloseDateSlider").dateRangeSlider("values").min !==$("#CloseDateSlider").dateRangeSlider("bounds").min ||
       $("#CloseDateSlider").dateRangeSlider("values").max !==$("#CloseDateSlider").dateRangeSlider("bounds").max ){
        old_close_date=$("#CloseDateSlider").dateRangeSlider("values").min.getFullYear()+'-'+('0'+($("#CloseDateSlider").dateRangeSlider("values").min.getMonth()+1)).slice(-2)+'-'+('0'+$("#CloseDateSlider").dateRangeSlider("values").min.getDate()).slice(-2);
        new_close_date=$("#CloseDateSlider").dateRangeSlider("values").max.getFullYear()+'-'+('0'+($("#CloseDateSlider").dateRangeSlider("values").max.getMonth()+1)).slice(-2)+'-'+('0'+$("#CloseDateSlider").dateRangeSlider("values").max.getDate()).slice(-2);
        url=url+"&oldest_close_date="+old_close_date+"&youngest_close_date="+new_close_date;
       }

  //Current loaded fields :
  var fields= [];
  $("#Filter .filterCheckbox").each(function() {
    fields.push($(this).attr('name'));
  });
  return $.getJSON(url, function(data) {
    if ($.fn.dataTable.isDataTable( '#project_table' )){
        var dtbl= $('#project_table').DataTable();
        dtbl.destroy();
        $("#project_table_filter").remove();
    }
    $("#project_table_body").empty();
    var size = 0;
    undefined_fields=[];
    $.each(data, function(project_id, summary_row) {
      $.each(summary_row, function(key,value){
        //this tracks the fields existing in our projects objects, but not present in the filter tab yet.
        if ($.inArray(key, undefined_fields) == -1 && $.inArray(key, fields) == -1 ){
          undefined_fields.push(key);
        }
      });
      size++;
      var tbl_row = $('<tr>');
      $.each(columns, function(i, column_tuple){
        tbl_row.append($('<td>')
          .addClass(column_tuple[1])
          .html(summary_row[column_tuple[1]])
          );
      });

      // Add links to projects
      tbl_row.find('td.project').html('<a href="/project/' + project_id + '">' + project_id + '</a>');

      // Add links to Portal References
      var portal_name = summary_row['customer_project_reference'];
      var portal_id = summary_row['portal_id'];
      tbl_row.find('td.customer_project_reference').html('<a target="_blank" href="https://ngisweden.scilifelab.se/order/'+portal_id + '">' + portal_name + '</a>');

      //parse and display running notes
      var latest_note = tbl_row.find('td.latest_running_note');
      if (latest_note.text() !== '') {
        var note = JSON.parse(latest_note.text());
        var ndate = undefined;
        for (key in note) { ndate = key; break; }
        notedate = new Date(ndate);
        latest_note.html('<div class="panel panel-default running-note-panel">' +
            '<div class="panel-heading">'+
              note[ndate]['user']+' - '+notedate.toDateString()+', ' + notedate.toLocaleTimeString(notedate)+
            '</div><div class="panel-body">'+make_markdown(note[ndate]['note'])+'</pre></div></div>');

      }
      $("#project_table_body").append(tbl_row);
    });
    load_undefined_columns(undefined_fields)

    // Initialise the Javascript sorting now that we know the number of rows
    init_listjs(size, columns);
  });
}

function load_table_head(columns){
  var tbl_head = $('<tr>');
  var tbl_foot = $('<tr>');
  $.each(columns, function(i, column_tuple) {
    tbl_head.append($('<th>')
      .addClass('sort a')
      .attr('data-sort', column_tuple[1])
      .text(column_tuple[0])
    );
    tbl_foot.append($('<th>')
      .text(column_tuple[0])
    );
  });
  $("#project_table_head").html(tbl_head);
  $("#project_table_foot").html(tbl_foot);
}


// Undefined columns handled here now
function load_undefined_columns(cols) {
    var columns_html = "";
    $.each(cols, function(col_id, column) {
      $("#undefined_columns").append('<div class="checkbox">'+
          '<label>'+
            '<input type="checkbox" class="filterCheckbox" data-columngroup="undefined-columns" data-displayname="'+column+'" name="'+column+'" id="undefined-columns-'+column+'">'+
            column+
          '</label>'+
        '</div>');
    });
};


// Initialize sorting and searching javascript plugin
function init_listjs(no_items, columns) {
    // Setup - add a text input to each footer cell
    $('#project_table tfoot th').each( function () {
      var title = $('#project_table thead th').eq( $(this).index() ).text();
      $(this).html( '<input size=10 type="text" placeholder="Search '+title+'" />' );
    } );

    //initialize custom project sorting
    jQuery.extend(jQuery.fn.dataTableExt.oSort, {
            "pid-pre": function(a) {
                        return parseInt($(a).text().replace(/P/gi, ''));
                            },
            "pid-asc": function(a,b) {
                        return a-b;
                            },
            "pid-desc": function(a,b) {
                        return b-a;
                            }
    });
    if ($.fn.dataTable.isDataTable( '#project_table' )){
        var table = $('#project_table').DataTable();
    }else{
        var table = $('#project_table').DataTable({
           "aoColumnDefs": [
              {"sType": "pid", "aTargets": [0]}
           ],
          "paging":false,
          "destroy": true,
          "info":false,
          "order": [[ 0, "desc" ]]
        });
    }

    //Add the bootstrap classes to the search thingy
    $('div.dataTables_filter input').addClass('form-control search search-query');
    $('#project_table_filter').addClass('form-inline pull-right');
    $("#project_table_filter").appendTo("h1");
    $('#project_table_filter label input').appendTo($('#project_table_filter'));
    $('#project_table_filter label').remove();
    $("#project_table_filter input").attr("placeholder", "Search..");
    // Apply the search
    table.columns().every( function () {
        var that = this;
        $( 'input', this.footer() ).on( 'keyup change', function () {
            that
            .search( this.value )
            .draw();
        } );
    } );
}

//Check or uncheck all fields from clicked category
function choose_column(col){
  var column = document.getElementById(col);
  //Get all the children (checkboxes)
  var cbs = column.getElementsByTagName('input');
  //If one of them is checked we uncheck it, if none of them are checked,
  //we check them all
  var checked = false;
  for (var i = 0; i < cbs.length; i++) {
    if (cbs[i].checked) {
      cbs[i].checked = false;
      checked = true;
    }
  }
  if (!checked) {
    for (var i = 0; i < cbs.length; i++) {
      cbs[i].checked = true;
    }
  }
}

////////////////////////////////
// Presets related functions  //
///////////////////////////////

function load_presets() {
  return $.getJSON('/api/v1/presets?presets_list=pv_presets', function (data) {
    var default_presets = data['default'];
    var user_presets = data['user'];
    // Default presets
    for (var preset in default_presets) {
      $('#default_preset_buttons').append('<button id="'+prettify(preset)+'" data-action="filterPresets" type="button" class="search-action btn btn-default">'+preset+'</button>');
    }
    // User presets, if there are any
    if (!jQuery.isEmptyObject(user_presets)) {
      for (var preset in user_presets) {
        $('#user_presets_dropdown').append('<button id="'+prettify(preset)+'" data-action="filterPresets" type="button" class="search-action btn btn-default">'+preset+'</button>');
      }
    }
    else {
      $('#user_presets_dropdown').append('No user presets');
    }
    // Check default checkboxes
    if (!$("#Filter :checked").length) {
      reset_default_checkboxes(false, data=data);
    }
    // Otherwise, load the table
    else {
      load_table();
    }
  });
}


// Column filtering clicks
$('body').on('click', '.search-action', function(event) {
  event.preventDefault();
  switch ($(this).data('action')) {
    case 'filterReset':
      reset_default_checkboxes(true);
    case 'filterApply':
      load_table();
      break;
    case 'filterHeader':
      choose_column($(this).parent().attr("id"));
      break;
    case 'filterPresets':
      select_from_preset($(this).parent().attr('id'), $(this).text());
      break;
  }
});

function reset_default_checkboxes(setdefault, data=null){
  setdefault = typeof setdefault !== 'undefined' ? setdefault : false;
  // Are we on a filtered page?
  if(!setdefault && $('.projects_page_heading').attr('id') == 'ongoing'){
    select_from_preset('default_preset_buttons', 'Lab personnel - Ongoing', data=data);
  } else if(!setdefault &&  $('.projects_page_heading').attr('id') == 'reception_control'){
    select_from_preset('default_preset_buttons', 'Lab personnel - Reception control', data=data);
  } else if(!setdefault &&  $('.projects_page_heading').attr('id') == 'pending'){
    select_from_preset('default_preset_buttons', 'Order Status', data=data);
  } else if(!setdefault &&  $('.projects_page_heading').attr('id') == 'pending_review'){
    select_from_preset('default_preset_buttons', 'Need Review', data=data);
  } else {
    // Sort out the button classes
    $('#default_preset_buttons button.active').removeClass('active');
    $('#resetProjectCols').addClass('active');
    // Change the checkboxes
    $('#Filter input').prop('checked', false); // uncheck everything
    $('#basic-columns input').prop('checked', true); // check the 'basic' columns
    // Apply the filter
    load_table();
  }
}

function read_current_filtering(){
  var columns = new Array();
  $("#Filter .filterCheckbox:checked").each(function() {
    columns.push([$(this).data('displayname'), $(this).attr('name')]);
  });
  return columns;
}

function sel_from_ps(preset_type, preset, data){
    //First uncheck everything
    $('#default_preset_buttons button.active').removeClass('active');
    $('#Filter input:checkbox').removeAttr('checked');
    if (preset_type == "default_preset_buttons") {
      var choices = data['default'][preset];
      for (column in choices) {
        for (choice in choices[column]) {
          var column_id = column.toLowerCase().replace(/_/g, '-') + '-' + choice;
          prettyobj(column_id).prop('checked', choices[column][choice]);
        }
      }
      prettyobj(preset).addClass('active');

    } else if (preset_type == "users_presets_dropdown") {
      // TODO - implement this
    }

    // Apply the filter
    load_table();
}
function select_from_preset(preset_type, preset, data=null) {
    if (data == null){
     $.getJSON('/api/v1/presets?presets_list=pv_presets', function(data){sel_from_ps(preset_type, preset, data)}).fail(function(jqXHR, textStatus, errorThrown) { alert('getJSON request failed! ' + textStatus); });
    }else{
        sel_from_ps(preset_type, preset, data);
    }
}


//
// HELPER FUNCTIONS
//

function prettify(s) {
  // Replaces whitespace with underscores. Replaces sequential _s with one
  // Removes trailing underscores
  return s.toLowerCase().replace(/\s+/g, "_").replace(/_+/g, "_").replace(/^_/, "").replace(/_$/, "");
}

// These functions avoid parsing errors due to jQuery not liking element
// IDs with brackets in. Otherwise eqivalent to $('#'+s)
function prettyobj(s) {
  return $(document.getElementById(prettify(s)));
}
function safeobj(s) {
  return $(document.getElementById(s));
}
