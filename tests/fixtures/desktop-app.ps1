param([string]$Title = 'OrchestrAI E2E Fixture')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName PresentationFramework
[xml]$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation" Title="$Title" Width="680" Height="500" WindowStartupLocation="CenterScreen">
  <Grid Margin="16">
    <TabControl AutomationProperties.AutomationId="MainTabs">
      <TabItem Header="Home" AutomationProperties.Name="Home" AutomationProperties.AutomationId="HomeTab">
        <TextBlock Margin="24" Text="Harmless synthetic desktop fixture" />
      </TabItem>
      <TabItem Header="Settings" AutomationProperties.Name="Settings" AutomationProperties.AutomationId="SettingsTab">
        <StackPanel Margin="24">
          <TextBox AutomationProperties.Name="Normal test field" AutomationProperties.AutomationId="NormalField" Width="300" HorizontalAlignment="Left" Margin="0,0,0,12" />
          <PasswordBox AutomationProperties.Name="Simulated password field" AutomationProperties.AutomationId="PasswordField" Width="300" HorizontalAlignment="Left" Margin="0,0,0,12" />
          <Button AutomationProperties.Name="Save" AutomationProperties.AutomationId="SaveButton" Content="Save" IsEnabled="False" Width="90" HorizontalAlignment="Left" />
        </StackPanel>
      </TabItem>
    </TabControl>
  </Grid>
</Window>
"@
$reader = New-Object System.Xml.XmlNodeReader $xaml
$window = [Windows.Markup.XamlReader]::Load($reader)
[void]$window.ShowDialog()
