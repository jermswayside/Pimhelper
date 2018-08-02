$(function () {

	var primeTarget = null;
	var allFlashcards = [];
	var countPaste = 0;
	var pasteLimit = 0;
	var inputA, inputB;
	var inviteList = [];
	var currentInviteList = [];

	var formCount = 1;

	var checkBoxes = {'AP1':10484,'AP2':11138,'AZU':3,'CHD':12271,'CHU':6698,'EC1':13463,'EC2':13507,'EC3':13518,'NB1':5825,'NB2':12741,'SCM':13435,'TEJ':1955,'TRI':3551};

	function initPimcore () {

		$('body').append('<style>#j-show-hide {position:fixed;top:0;right:60px;} .j-hidden{display:none!important;}');
		$('body').append('<button id="j-show-hide">SHOW/HIDE</button>');
		$('body').append('<style> #j-toolkit{ padding:0px 0px 0px 100px;background:lightgreen;width:100%; } </style>');

		$('body').prepend('<div id="j-toolkit"><div id="j-nav">'+/*
			'<button class="j-toggle" data-target="compare-students">COMPARE</button>'+
			'<button class="j-toggle" data-target="matching">MATCHING</button>'+
			'<button class="j-toggle" data-target="flashcard">FLASHCARDS</button>'+*/
			'<button class="j-toggle" data-target="review">review</button>'+/*
			'<button class="j-toggle" data-target="permissions">PERMISSIONS</button>'+
			'<button class="quiz-perms">QUIZ PERMISSIONS</button>'+
			'<button class="j-toggle" data-target="creationDate">CREATION DATE</button>'+*/
			'</div></div>');

		$('#j-toolkit').append('<div class="j-tools" data-target="creationDate"><button id="j-get-creation-date">GET</button><textarea id="j-creation-date-paste" placeholder="creation dates"></textarea></div><br />');

		$('#j-get-creation-date').click(function () {

			var output = '';
			var items = $('.x-panel .x-panel-body .x-grid3 .x-grid3-scroller tr');
			console.log(items.length)
			for (var i = 0; i < items.length; i++) {
				output += items.eq(i).find('.x-grid3-td-5 .x-grid3-cell-inner').text() +',';
				output += items.eq(i).find('.x-grid3-td-3 .x-grid3-cell-inner').text()+'\n';
			};
			$('#j-creation-date-paste').val(output);
		});


		$('#j-toolkit').append('<div class="j-tools" data-target="matching"><button id="j-select">SELECT</button><button id="j-copy-flashcards">COPY FLASHCARDS</button><button id="j-paste-">PASTE FLASHCARDS</button><input type="number" id="j-paste-limit"><input type="number" id="j-purge" placeholder="purge"></div><br />');

		$('#j-toolkit').append('<div class="j-tools" data-target="flashcard"><textarea id="j-input-a-flash"></textarea><textarea id="j-input-b-flash"></textarea><button id="j-paste-from-input">PASTE INPUT</button></div>');

		$('#j-toolkit').append('<div class="j-tools" data-target="review">'+
			'<input type="text" id="j-rev-count" value="1" size="2">'+
			'<input type="text" placeholder="Titles" size="10" id="j-rev-book">'+
			'<input type="text" placeholder="Email" size="10" id="j-rev-email">'+
			'<input type="text" placeholder="Username" size="10" id="j-rev-username">'+
			'<input type="text" placeholder="Password" size="10" id="j-rev-password">'+
			'<input type="text" placeholder="First Name" size="10" id="j-rev-firstname">'+
			'<input type="text" placeholder="YYYY-MM-DD" size="10" id="j-rev-date">'+
			'<button id="j-review">create</button><button id="j-check-codes">ref</button></div>');

		$('#j-toolkit').append('<div class="j-tools" data-target="compare-students"><textarea class="target-students"></textarea><textarea class="compare-results"></textarea><input type="checkbox" class="and-remove-confirmed-students"><input type="submit" class="compare-submit"></div><div class="j-tools" data-target="permissions"><button id="perm-select">SELECT</button> <input type="text" placeholder="trail" id="perm-target" value="textbooks > entreculturas-ii > recursos > solo-para-profesores"></div>');

		//toggles
		$('.j-tools').addClass('j-hidden');
		var openTool = null;
		$('#j-nav > .j-toggle').click(function(event) {

			$('.j-tools').addClass('j-hidden');
			if ('.j-tools[data-target='+$(this).data('target')+']'==openTool) {
				openTool = null;
				return;
			}
			$('.j-tools[data-target='+$(this).data('target')+']').toggleClass('j-hidden');
			openTool = '.j-tools[data-target='+$(this).data('target')+']';
		});


		//PERMISSIONS STUFF

		var permissionsCallback = function (e) {
			changePerms(e.children());
		}

		var toChangePerms = [];

		function changePerms (list, amRoot) {
			for (var i = 0; i < list.length; i++) {
				doChangePerm(list[i]);
				clickForChildren(list[i])
				setTimeout(function () {
					if (list[i].children().length>0)
						toChangePerms.push(list[i].children());
				}, 2000);
			}
			setTimeout(function () {
				if (amRoot===true && toChangePerms.length>0) {
					changePerms(toChangePerms.shift(), true);
				}
			}, 10000);
		}

		function doChangePerm(e) {
			clickToEdit(e);
			var myTab = findTabByName( getNodeText(e) );
			closeTab(myTab);
		}

		function closeTab(t) {
			t.find('.x-tab-strip-close').click();
		}

		function findTabByName(name) {
			var tabs = $('ul.x-tab-strip li');
			for (var i = 0; i < tabs.length; i++) {
				if ($(tabs[i]).find('.x-tab-strip-text').text()==name)
					return $(tabs[i]);
			}
			return false;
		}

		$('#perm-select').click(function(event) {

			var t = $('#perm-target').val().split(">");
			var nodeList = $('#pimcore_panel_tree_objects .x-tree-root-ct > .x-tree-node');
			globalCallback = changePerms
			clickTo(nodeList, t);
		});

		function getNodeText(n) {
			return $( $( n ).find('.x-tree-node-anchor > span')[0] ).text().trim();
		}

		function getChildren(e) {
			return $(e).children().last().children();
		}

		function clickForChildren(e) {
			var toClick = $( e ).find('.x-tree-ec-icon.x-tree-elbow-plus')[0];
			if (typeof toClick == 'undefined')
				toClick = $( e ).find('.x-tree-ec-icon.x-tree-elbow-end-plus')[0];
			toClick.click();
		}

		function clickTo(n, t) {
			var nodes = getChildren(n);
		  console.log(nodes)
			if (nodes.length==0)
				return;
			if (t.length==0)
				return globalCallback(n);
		  for (var i = 0; i < nodes.length; i++) {
		    console.log( $( $( nodes[i] ).find('.x-tree-node-anchor > span')[0] ).text().trim()+' == '+t[0].trim() )
		    if ($( $( nodes[i] ).find('.x-tree-node-anchor > span')[0] ).text().trim() == t[0].trim() ) {
					console.log(nodes[i])
					clickForChildren(nodes[i]);
		      t.shift();
		      setTimeout( function () {
						console.log('boop')
		      	clickTo( nodes[i], t);
		      }, 3000)
		      return;
		    }
		  }
		}

		function targetStudentInString (targets, string) {
			for (var i = 0; i < targets.length; i++) {
				if (string.toLowerCase().indexOf(targets[i].toLowerCase())!=-1) {
					return true;
				}
			}
			return false;
		}

				$('#j-get-creation-date').click(function () {
			var output = '';
			var items = $('.x-panel .x-panel-body .x-grid3 .x-grid3-scroller tr');
			for (var i = 0; i < items.length; i++) {
				output += items.eq(i).find('.x-grid3-td-3 .x-grid3-cell-inner').text();
			};
			$('#j-creation-date-paste').text(output);
		});


		function compareStudentsListener () {
			console.log($('.target-students').length)
			$('.compare-submit').click(function () {
				var str = '';
				var confirmed = [];
				var targets = $('.target-students').val().split('\n');
				var andRemove = $('.and-remove-confirmed-students').is(':checked');
				console.log(andRemove)
				console.log(targets)
				$.each($('.x-grid3-col-path'), function () {
					if (targetStudentInString(targets, $(this).text())) {
						var newval = $(this).text().replace('.*\/', '');
						newval = newval.replace('-.*', '');
						confirmed.push( newval );
						$(this).attr('style','background-color:red !important;'); //('background-color','red');
					}
				});
				$('.compare-results').val(confirmed.sort().join('\n'));
				console.log(str)
				console.log($('.x-grid3-col-path').length)
			});
		}
		compareStudentsListener();

		var lastKey = null;

		$('.quiz-perms').click(function () {
			$(window).keydown(function (e) {
			if (e.key=='z' && lastKey=='z') {
				if ($('input[name=maxGrade]:visible').length<1)
					return;
				$('input[name=maxGrade]:visible').val(100)
				$('input[name=passTreshold]:visible').val(80)
				$('input[name=attemptLimit]:visible').val(3)
				$('.x-btn-text.pimcore_icon_publish_medium:visible').click()
				lastKey = null;
			} else {lastKey = e.key;}
			
		});

		});
		//REVIEW STUFF
		$('#j-check-codes').click(function () {
			var codeString = "";
			for (var key in checkBoxes) {
				codeString+=key+" , ";
			};
			alert(codeString);	
		});

		$('#j-rev-count').change(function () {
			formCount = $(this).val();
		});

		$('#j-review').click(function () {
			var form = document.getElementsByTagName("IFRAME")[0];
			form = $( $(form.contentDocument).find('form')[0] );

			var emailTemplate = $('#j-rev-email').val();
			var usernameTemplate = $('#j-rev-username').val();
			var passwordTemplate = $('#j-rev-password').val();
			var firstnameTemplate = $('#j-rev-firstname').val();

			form.find('input#email').val(emailTemplate+formCount);
			form.find('input#username').val(usernameTemplate+formCount);
			form.find('input#password').val(passwordTemplate);
			form.find('input#firstname').val(firstnameTemplate+formCount);
			
			form.find('input#enddate').val($('#j-rev-date').val());

			var targets = $('#j-rev-book').val().split(',');

			for (var i = 0; i < targets.length; i++) {
				$( form.find('.code-type-checkbox[value='+checkBoxes[targets[i].trim()]+']')).prop('checked', true);
			}
			$(form.find('button[type=submit]')).click();
			formCount++;
			$('#j-rev-count').val(formCount);
		});

		$('#j-select').click(function (e) {
			primeSelect()
		});

		$('#j-show-hide').click(function () {
			$('#j-toolkit').toggleClass('j-hidden');
		})

		$('#j-copy-flashcards').click(function () {
			allFlashcards = []
			$.each( $(primeTarget).find('.cke_editable p'), function (index, val) {
				allFlashcards.push( $(this).html() );
			});
			console.log(allFlashcards)
		});

		$('#j-paste-flashcards').click(function () {
			console.log( $(primeTarget).find('.pimcore_icon_plus')[0])
			countPaste = 0;
			pasteLimit = $('#j-paste-limit').val()=='' ? allFlashcards.length/2 : $('#j-paste-limit').val();
			setTimeout(function () {
				pasteFlash()
			}, 500);

			$.each( $(primeTarget).find('.cke_editable'), function (index, val) {
				allFlashcards.push( $(this).html() );
			});
			console.log(allFlashcards)
		});

		$('#j-purge').change(function () {
			for (var i = 0; i < $('#j-purge').val()*2; i++) {
				allFlashcards.shift()
			}
			console.log("PURGED "+$('#j-purge').val()*2)
		});

		$('#j-paste-from-input').click(function () {
			inputA = $('#j-input-a-flash').val().split('\n');
			inputB = $('#j-input-b-flash').val().split('\n');
			console.log(inputA)
			console.log(inputB)
			countPaste = 0;
			pasteLimit = inputA.length;
			console.log('COUNT PASTE '+countPaste)
			var temp = primeTarget;
			$(primeTarget).find('.pimcore_icon_plus')[0].click();
			primeTarget = temp;
			if (countPaste<pasteLimit) {
				countPaste++;
				setTimeout(function () {
					pasteFromInput();
				}, 500);
			} else {
				var locCount = 0;
				$.each( $(primeTarget).find('.cke_editable'), function (index, val) {

					if (locCount<(pasteLimit*2))
						$(this).html('<p>'+allFlashcards.shift()+'</p>');

					locCount++;
				});
				countPaste = 0;
			}
		})

		function pasteFromInput () {
			var temp = primeTarget;
			$(primeTarget).find('.pimcore_icon_plus')[0].click();
			primeTarget = temp;
			if (countPaste<pasteLimit) {
				countPaste++;
				setTimeout(function () {
					pasteFromInput();
				}, 500);
			} else {
				var locCount = 0;
				$.each( $(primeTarget).find('.cke_editable'), function (index, val) {

					if (locCount%2==0)
						$(this).html('<p>'+inputA.shift()+'</p>');
					else
						$(this).html('<p>'+inputB.shift()+'</p>');
					locCount++;
				});
				countPaste = 0;
			}
		}

		function pasteFlash () {
			console.log('COUNT PASTE '+countPaste)
			var temp = primeTarget;
			$(primeTarget).find('.pimcore_icon_plus')[0].click();
			primeTarget = temp;
			if (countPaste<pasteLimit) {
				countPaste++;
				setTimeout(function () {
					pasteFlash();
				}, 500);
			} else {
				var locCount = 0;
				$.each( $(primeTarget).find('.cke_editable'), function (index, val) {

					if (locCount<(pasteLimit*2))
						$(this).html('<p>'+allFlashcards.shift()+'</p>');

					locCount++;
				});
				countPaste = 0;
			}
		}

		function primeSelect () {
			$('body').append('<style id="hover-styles">.j-selected-item {position:relative!important;} .j-selected-item::after {position:absolute;top:0;left:0;right:0;bottom:0;opacity:.3;background-color:lightgreen;z-index:99999;} .x-panel-body .x-panel-body .x-panel-body .x-tab-panel-body .x-panel-body.x-panel-body-noheader.x-panel-body-noborder:hover {border:3px blue solid !important;}</style>')
			$('body').click(function (e) {
				console.log(e.target)
				console.log(e.target.id.indexOf('j-'))
				if (e.target.id.indexOf('j-')===-1 && $(e.target).hasClass('x-panel-body')) {
					$(primeTarget).removeClass('j-selected-item');
					primeTarget = e.target;
					$(e.target).addClass('j-selected-item');

				}
			});
		}

	}

	function initLS () {
		return;
		console.log('NOT PIM')
		$('body').append('<div id="j-toolkit" style="z-index:99999999;background-color:lightblue;position:fixed;top:0;left:0;width:100%;padding:0 15%;"><button id="j-student-invites">INVITES</button></div>');
		$('#j-toolkit').append('<br /> <div id="j-student-invites-bar" class="j-hidden"><input type="text" id="j-invite-list" val=""><span>&nbsp;NEXT:<span id="j-next-student"></span>&nbsp;</span><button id="j-invite-button">INVITE STUDENT</button></div>')
		$('body').append('<style>.j-hidden{display:none!important;}</style>');

		$('#j-student-invites').click(function () {
			$('#j-student-invites-bar').toggleClass('j-hidden');
		});

		$('#j-invite-list').change(function () {
			inviteList = $('#j-invite-list').val().split(',');
		});
		$('#j-invite-button').click(function () {
			if (currentInviteList.length==0)
				currentInviteList = inviteList.splice(0);
			$('form.Create_Invite_Form input.ws-input-1').val(currentInviteList.shift());
			$('form .Btn_Create_Invite').click()
			if (currentInviteList.length==0)
				$('#j-next-student').html('END OF LIST')
			else
				$('#j-next-student').html(currentInviteList[0])

		})
	}


	if (window.location.href.indexOf('admin')!=-1) {
		console.log('PIMCORE')
		initPimcore();
	} else {
		var lastKey = null;
		$(window).keyup(function (e) {
			console.log(e.key, lastKey, lastKey == e.key && lastKey == 'Control')
			if (lastKey == e.key && lastKey == 'Control' && $('#j-toolkit').length==0)
				initLS()
			lastKey = e.key
		})
		//initLS();
	}

})
