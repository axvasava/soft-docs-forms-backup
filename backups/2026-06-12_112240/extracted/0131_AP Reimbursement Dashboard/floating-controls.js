function setFloatingButtonsLoadingState(isLoading) {
    $('#floatingRefreshBtn, #floatingTopBtn')
        .prop('disabled', isLoading)
        .toggleClass('disabled', isLoading);
}

function ensureFloatingControls() {
    if ($('#floatingControls').length) return;

    const $wrap = $('<div>', {
        id: 'floatingControls'
    });

    const $refreshBtn = $('<button>', {
        id: 'floatingRefreshBtn',
        type: 'button',
        html: '⟳ Refresh'
    })
        .addClass('btn btn-success sharedButton')
        .on('click', function () {
            if ($(this).prop('disabled')) return;
            $('#refreshBtn').click();
        });

    const $topBtn = $('<button>', {
        id: 'floatingTopBtn',
        type: 'button',
        html: '↑ Top'
    })
        .addClass('btn btn-info sharedButton')
        .on('click', function () {
            if ($(this).prop('disabled')) return;
            $('html, body').animate({ scrollTop: 0 }, 250);
        });

    $wrap.append($refreshBtn, $topBtn);
    $('body').append($wrap);

    setFloatingButtonsLoadingState(false);
}