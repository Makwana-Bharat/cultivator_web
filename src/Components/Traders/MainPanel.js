import React, { useState, useRef, useEffect } from 'react';
import KhedutTable from './KhedutTable';
import ViewFarmer from './ViewFarmer';
import $ from 'jquery';
import { Bill } from './Bill';
import { useSelector, useDispatch } from 'react-redux';
import { BackUpData } from './BackUp';
import { Vortex } from 'react-loader-spinner';
import Swal from 'sweetalert2';
import { dataRef } from '../../config/firebase2';
import { selectTraders, addFolder, selection, addEntry } from '../../redux/slices/authSlice';
import { toast } from 'react-toastify';
import ReactToPrint from 'react-to-print';
const AddFoldersAuth = (Folder) => addFolder(Folder);
const MainPanel = () => {

    const selectionIndex = useSelector(selection)
    const { Email, Trade, Farmers, Name } = useSelector(selectTraders);
    const [isLoading, setIsLoading] = useState(false);
    const [FolderName, setFolderName] = useState("");
    let dispatch = useDispatch();
    const componentRef = useRef();
    const [print, setPrint] = useState(false);
    useEffect(() => {
        toast.success(`પધારો.. ${Name}!`, {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: false,
            progress: undefined,
            theme: "dark",
        });
    }, [])
    const handleNewEntry = () => {
        Swal.fire({
            title: 'નવી નોંધ',
            html: `
      <div class="form-group">
  <input type="number" class="form-control" id="AddRupee" placeholder="રકમ (₹)">
</div>
<div class="form-group">
  <input id="Date" class="form-control" placeholder="date" type="date" value="${new Date().toISOString().split('T')[0]}">
</div>
<div class="form-group">
  <textarea id="AddDetail" class="form-control" placeholder="વિગત"></textarea>
</div>
<div class="form-group" style="width:100%;display:flex;justify-content:space-between">
  <div id="btnJam" class="btn bg-gradient-success text-white font-bold" style="font-weight:bold">જમા</div>
  <div id="btnUdhar" class="btn bg-gradient-danger text-white font-bold" style="font-weight:bold">ઉધાર</div>
</div>

    `,
            focusConfirm: false,
            showConfirmButton: false,
            showCancelButton: false,
            showCloseButton: false,
            allowOutsideClick: true,
            allowEscapeKey: false,
            showLoaderOnConfirm: true,
            didOpen: () => {
                const btnJam = Swal.getPopup().querySelector('#btnJam');
                const btnUdhar = Swal.getPopup().querySelector('#btnUdhar');

                btnJam.addEventListener('click', () => {
                    triggerSwalConfirmation('જમા ');
                });

                btnUdhar.addEventListener('click', () => {
                    triggerSwalConfirmation('ઉધાર');
                });
            }
        });

        function triggerSwalConfirmation(type) {
            const AddRupee = Swal.getPopup().querySelector('#AddRupee').value;
            const AddDetail = Swal.getPopup().querySelector('#AddDetail').value;
            const dateInput = Swal.getPopup().querySelector('#Date');
            const date = dateInput.value;

            if (!AddRupee || !AddDetail || !date) {
                Swal.showValidationMessage('કૃપયા કરી બધીજ માહિતી ઉમેરો..');
            } else {
                Swal.clickConfirm();
                const formattedDate = new Date(date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }).replace("/", "-").replace("/", "-");
                const Type = type;
                let newEntry = {
                    DATE: formattedDate,
                    DETAILS: AddDetail,
                    RUPEE: AddRupee,
                    TYPE: Type
                }
                const updates = {};
                const updates2 = {};
                toast.promise(
                    Promise.resolve(dataRef
                        .ref(`/Cultivator/Traders/${selectionIndex.TraderId}/Farmers/${selectionIndex.FarmerIndex}/Folder/${selectionIndex?.FolderIndex}/Invoice`).push(newEntry).key),
                    {
                        pending: `નવી એન્ટ્રી થઇ રહી છે.. `, // Optional pending message
                        success: `નવી એન્ટ્રી થઈ ગઈ.. `,
                        error: 'કૈંક વાંધો છે.. !',
                    }
                )
                    .then((IID) => {
                        updates[`/Cultivator/Traders/${selectionIndex.TraderId}/Farmers/${selectionIndex.FarmerIndex}/Date`] = formattedDate;
                        if (Type !== "જમા ") {
                            updates[`/Cultivator/Traders/${selectionIndex.TraderId}/Farmers/${selectionIndex.FarmerIndex}/Balance`] = eval(Farmers[selectionIndex?.FarmerIndex]?.Balance + "-" + AddRupee);
                            updates2[`/Cultivator/Traders/${selectionIndex.TraderId}/Farmers/${selectionIndex.FarmerIndex}/Folder/${selectionIndex?.FolderIndex}/Balance`] = eval(Farmers[selectionIndex?.FarmerIndex]?.Folder[selectionIndex?.FolderIndex].Balance + "-" + AddRupee);
                        }
                        else {
                            updates[`/Cultivator/Traders/${selectionIndex.TraderId}/Farmers/${selectionIndex.FarmerIndex}/Balance`] = eval(Farmers[selectionIndex?.FarmerIndex]?.Balance + "+" + AddRupee);
                            updates2[`/Cultivator/Traders/${selectionIndex.TraderId}/Farmers/${selectionIndex.FarmerIndex}/Folder/${selectionIndex?.FolderIndex}/Balance`] = eval(Farmers[selectionIndex?.FarmerIndex]?.Folder[selectionIndex?.FolderIndex].Balance + "+" + AddRupee);
                        }
                        dataRef.ref().update(updates);
                        dataRef.ref().update(updates2);
                        dispatch(addEntry({ ...newEntry, IID }));
                    })
                    .catch((error) => {

                    }).finally(() => setFolderName(""));
            }
        }
    };
    const addFolder = async (e) => {
        e.preventDefault();
        if (FolderName?.length < 1) {
            Swal.fire('Error', 'કૃપયા કરી ફોલ્ડર નામ ઉમેરો...', 'error');
            return;
        }
        let newFolder = {
            Balance: 0,
            Invoice: {},
            Year: FolderName
        };
        toast.promise(
            Promise.resolve(dataRef.ref(`/Cultivator/Traders/${selectionIndex.TraderId}/Farmers/${selectionIndex.FarmerIndex}/Folder`).push(newFolder).key),
            {
                pending: `${FolderName} ફોલ્ડર ઉમેરાયું છે...`, // Optional pending message
                success: `${FolderName} ફોલ્ડર ઉમેરાયું..`,
                error: 'કૈંક વાંધો છે..!',
            }
        )
            .then((MFID) => {
                dispatch(AddFoldersAuth({ ...newFolder, MFID }));
            })
            .catch((error) => {
                // Handle error
            })
            .finally(() => setFolderName(""));
    };
    const handleFolder = () => {
        $("#panelIcon").removeClass("mdi-home");
        $("#panelIcon").removeClass("mdi-account");
        $("#panelIcon").addClass("mdi-folder");
        $("#Index").css('display', 'none');

        //Khedut
        $("#ViewKhedut").css('display', 'flex');
        $("#FormAddFolder").css('display', 'block');
        $("#panelKhedut").css('display', 'block');

        //Account
        $("#ViewKhedutAccount").css('display', 'none');
        $("#Printbtn").css('display', 'none');
        $("#NewEntry").css('display', 'none');
        $("#panelAccount").css('display', 'none');
    }
    const handleIndex = () => {
        $("#panelIcon").addClass("mdi-home");
        $("#panelIcon").removeClass("mdi-account");
        $("#Index").css('display', 'block');

        //Khedut
        $("#ViewKhedut").css('display', 'none');
        $("#FormAddFolder").css('display', 'none');
        $("#panelKhedut").css('display', 'none');

        //Account
        $("#ViewKhedutAccount").css('display', 'none');
        $("#Printbtn").css('display', 'none');
        $("#NewEntry").css('display', 'none');
        $("#panelAccount").css('display', 'none');
    };


    $("#panelKhedut").on('click', function (e) {
        e.preventDefault();

        //Khedut
        $("#ViewKhedut").css('display', 'flex');
        $("#FormAddFolder").css('display', 'block');

        //Account
        $("#ViewKhedutAccount").css('display', 'none');
        $("#Printbtn").css('display', 'none');
        $("#NewEntry").css('display', 'none');
        $("#panelAccount").css('display', 'none');
    });
    return (
        <div className="main-panel">

            <div className="content-wrapper">
                <div className="page-header">
                    <h3 className="page-title w-100 d-flex align-items-center">
                        <span className="page-title-icon bg-gradient-primary text-white">
                            <i className="mdi mdi-home" id="panelIcon"></i>
                        </span>
                        <div className="d-flex" style={{ width: '60%', cursor: 'pointer' }}>
                            <span id="panelName" onClick={handleIndex}>&nbsp; અનુક્રમણિકા</span>
                            <span id="panelKhedut" style={{ display: 'none' }} onClick={handleFolder} > \ ખેડૂત </span>
                            <span id="panelAccount" style={{ display: 'none' }}> \ ખાતાવહી</span>
                        </div>
                        <span className="float-end" style={{ width: '40%' }}>
                            <div className="d-flex justify-content-end" style={{ width: '100%' }}>
                                <button className="bg-gradient-success text-white me-2 border rounded-2" id="NewEntry" style={{ boxShadow: '2px 2px 5px rgba(0,0,0,.1),inset -2px -2px 3px rgba(0,0,0,.2)', padding: '10px', display: 'none' }}
                                    onClick={() => handleNewEntry(Farmers, selectionIndex)}
                                >
                                    <i className="mdi mdi-plus"></i>
                                    &nbsp; New &nbsp;
                                </button>
                                <ReactToPrint
                                    trigger={() => {
                                        return <button className="bg-gradient-primary text-white me-2 border rounded-2" id="Printbtn" onClick={() => setPrint(true)} style={{ boxShadow: '2px 2px 5px rgba(0,0,0,.1),inset -2px -2px 3px rgba(0,0,0,.2)', padding: '10px', display: 'none' }}>
                                            &nbsp; Print &nbsp;
                                            <i className="mdi mdi-printer"></i>
                                        </button>
                                    }}
                                    onBeforeGetContent={() => setPrint(true)}
                                    onAfterPrint={() => setPrint(false)}
                                    content={() => componentRef.current}
                                    pageStyle="@media print {
                                                    @page { margin: 1px;padding:10px }
                                                    body { margin: 1.6cm; }
                                            }"
                                />
                            </div>
                            <form id="FormAddFolder" style={{ display: 'none' }} onSubmit={addFolder}>
                                <input type="text" name="" value={FolderName} onChange={(e) => setFolderName(e.target.value)} id="MainFolderName" style={{ margin: '5px', border: 'none', height: '40px', borderRadius: '5px', paddingLeft: '10px', boxShadow: '2px 2px 3px gray,inset -2px -2px 3px rgba(0,0,0,.2)' }} placeholder="Folder Name" />
                                <button className="bg-gradient-primary text-white me-2 border rounded-2" style={{ boxShadow: '2px 2px 5px rgba(0,0,0,.1),inset -2px -2px 3px rgba(0,0,0,.2)', padding: '10px' }}>
                                    <i className="mdi mdi-plus" id="panelIcon"></i>
                                    Add Folder
                                </button>
                            </form>
                        </span>
                    </h3>
                    <div id="BackUp" className="btn-gradient-info d-flex justify-content-center align-items-center rounded-3 position-fixed float-end" style={{ zIndex: '100000000', fontSize: '24px', top: '90%', right: '20px', width: '55px', height: '55px', padding: '0', boxShadow: '2px 2px 5px rgba(0,0,0,.1),inset -2px -2px 3px rgba(0,0,0,.2)', cursor: 'pointer' }} onClick={async () => {
                        setIsLoading(true);
                        await BackUpData(Email, Trade);
                        setIsLoading(false);
                    }}>
                        {isLoading ? <Vortex
                            visible={true}
                            height="40"
                            width="40"
                            ariaLabel="vortex-loading"
                            wrapperStyle={{}}
                            wrapperClass="vortex-wrapper"
                            colors={['red', 'green', 'blue', 'yellow', 'orange', 'purple']}
                        /> : <i className="mdi mdi-arrow-upmdi mdi-google-drive" style={{ fontSize: '28px', color: '#fff' }}></i>}
                    </div>
                </div>
                <KhedutTable />
                {Farmers !== undefined && <ViewFarmer />}
                {Farmers !== undefined && Farmers[selectionIndex.FarmerIndex] !== undefined && <Bill ref={componentRef} PrintStyle={print} />}
            </div>
        </div>
    );
};

export default MainPanel;
