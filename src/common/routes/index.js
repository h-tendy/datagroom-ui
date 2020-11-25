import React from 'react';
import PageContent from './PageContent';
import SideBar from '../components/SideBar';
import {HomeMenu} from './home';

export const Menu = (
  <SideBar>
    <SideBar.MenuSection title=" ">
      {HomeMenu}
    </SideBar.MenuSection>
  </SideBar>
);

export default PageContent
