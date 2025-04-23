function handleProvinceChange(
  provinceSelector,
  districtSelector,
  oldDistrictSelector
) {
  $(provinceSelector).change(function () {
    const provinceId = $(this).val();

    if (provinceId) {
      $.ajax({
        url: "/students/get-districts/" + provinceId,
        method: "GET",
        success: function (districts) {
          $(districtSelector).html(
            "<option hidden>--select district--</option>"
          );
          districts.forEach(function (district) {
            $(districtSelector).append(
              `<option value="${district.id}">${district.name}</option>`
            );
          });

          const oldDistrict = $(oldDistrictSelector).val();
          if (oldDistrict) {
            $(districtSelector).val(oldDistrict).trigger("change");
          }
        },
        error: function () {
          alert("Failed to fetch districts");
        },
      });
    } else {
      $(districtSelector).html("<option hidden>--select district--</option>");
    }
  });

  // Trigger change if province is already selected
  if ($(provinceSelector).val()) {
    $(provinceSelector).trigger("change");
  }
}

function handleDistrictChange(districtSelector, vdcSelector, oldVdcSelector) {
  $(districtSelector).change(function () {
    const districtId = $(this).val();

    if (districtId) {
      $.ajax({
        url: "/students/get-vdcs/" + districtId,
        method: "GET",
        success: function (vdcs) {
          $(vdcSelector).html(
            '<option value="" hidden>--select vdc/municipality--</option>'
          );
          vdcs.forEach(function (vdc) {
            $(vdcSelector).append(
              `<option value="${vdc.id}">${vdc.name}</option>`
            );
          });

          const oldVdc = $(oldVdcSelector).val();
          // alert(oldVdc);
          if (oldVdc) {
            $(vdcSelector).val(oldVdc).trigger("change");
          }
        },
        error: function () {
          alert("Failed to fetch VDCs");
        },
      });
    } else {
      $(vdcSelector).html(
        '<option value="" hidden>--select vdc/municipality--</option>'
      );
    }
  });

  // Trigger change if district is already selected
  if ($(districtSelector).val()) {
    $(districtSelector).trigger("change");
  }
}

$(document).ready(function () {
  $(document).ready(function () {
    handleProvinceChange("#pprovince", "#pdistrict", "#oldPdistrict");
    handleProvinceChange("#tprovince", "#tdistrict", "#oldTdistrict");
    handleDistrictChange("#pdistrict", "#pvdc", "#oldPvdc");
    handleDistrictChange("#tdistrict", "#tvdc", "#oldTvdc");
  });
});

$(document).ready(function () {
  $("#makeAddressSame").change(function () {
    if ($(this).is(":checked")) {
      const pProvince = $("#pprovince").val();
      const pDistrict = $("#pdistrict").val();
      const pVdc = $("#pvdc").val();
      const pWard = $("#pward").val();

      if (pProvince) $("#tprovince").val(pProvince).trigger("change");
      setTimeout(() => {
        if (pDistrict) $("#tdistrict").val(pDistrict).trigger("change");
      }, 100);
      setTimeout(() => {
        if (pVdc) $("#tvdc").val(pVdc);
        if (pWard) $("#tward").val(pWard);
      }, 200);
    } else {
      $("#tprovince")
        .html('<option value="">--select province--</option>')
        .trigger("change");

      $("#tdistrict").html('<option value="">--select district--</option>');
      $("#tvdc").html('<option value="">--select vdc/municipality--</option>');
      $("#tward").val("");
    }
  });
});
