import Layout from "@/components/Layout";
import SectionsWithManufacturers from "@/components/SectionsWithManufacturers";

const Pumps = () => {
    return (
        <Layout>
            <SectionsWithManufacturers 
                title="Pumps"
                description="Explore our selection of industrial pumps from leading manufacturers. We offer a wide range of pump types including centrifugal, diaphragm, positive displacement, and more."
                page="pumps"
            />
        </Layout>
    );
};

export default Pumps;
