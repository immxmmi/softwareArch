document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('generate').addEventListener('click', function () {
        var serviceListFile = document.getElementById('serviceListInput').files[0];
        var callerCalleeFile = document.getElementById('callerCalleeInput').files[0];
        var commonChangesFile = document.getElementById('commonChangesInput').files[0];
        var companyName = document.getElementById('companyName').value.trim();

        if (serviceListFile && callerCalleeFile && commonChangesFile && companyName) {
            var formData = new FormData();
            formData.append('serviceList', serviceListFile);
            formData.append('callerCallee', callerCalleeFile);
            formData.append('commonChanges', commonChangesFile);
            formData.append('companyName', companyName);

            fetch('http://localhost:3000/upload', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    console.log(data);
                    alert('Files have been successfully uploaded and processed.');
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred while uploading the files.');
                });
        } else {
            alert('Please fill in all fields and select all files.');
        }
    });
});
