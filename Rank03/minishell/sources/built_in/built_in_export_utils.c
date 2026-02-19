/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   built_in_export_utils.c                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/02 18:10:46 by chlpesty          #+#    #+#             */
/*   Updated: 2026/02/04 15:00:31 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

char	*var_name_export(char *arg);
char	*escaped_quotes(char *content);
int		len_esc_content(char *content);
char	**copy_envp(char **envp);
void	bubble_sort_envp(char **envp);

char	*var_name_export(char *arg)
{
	char	*var_name;
	int		len;

	if (!arg)
		return (NULL);
	if (arg[0] == '=')
		return (ft_strdup(arg));
	len = 0;
	while (arg[len] != '\0' && arg[len] != '=')
		len++;
	var_name = malloc(sizeof(char) * (len + 1));
	if (!var_name)
		return (NULL);
	ft_memcpy(var_name, arg, len);
	var_name[len] = '\0';
	return (var_name);
}

char	*escaped_quotes(char *content)
{
	int		i;
	int		j;
	int		len;
	char	*corrected_content;

	if (!content)
		return (NULL);
	i = 0;
	len = len_esc_content(content);
	corrected_content = malloc(len + 1);
	if (!corrected_content)
		return (NULL);
	i = 0;
	j = 0;
	while (content[i] != '\0')
	{
		if (content[i] == '"' || content[i] == '$'
			|| content[i] == '\\' || content[i] == '`')
			corrected_content[j++] = '\\';
		corrected_content[j++] = content[i++];
	}
	corrected_content[j] = '\0';
	return (corrected_content);
}

int	len_esc_content(char *content)
{
	int	i;
	int	len;

	i = 0;
	len = 0;
	while (content[i] != '\0')
	{
		if (content[i] == '"' || content[i] == '$'
			|| content[i] == '\\' || content[i] == '`')
			len++;
		len++;
		i++;
	}
	return (len);
}

char	**copy_envp(char **envp)
{
	char	**copy;
	int		count;
	int		i;

	count = 0;
	while (envp && envp[count])
		count++;
	copy = malloc((count + 1) * sizeof(char *));
	if (!copy)
		return (NULL);
	i = 0;
	while (i < count)
	{
		copy[i] = envp [i];
		i++;
	}
	copy[count] = NULL;
	return (copy);
}

void	bubble_sort_envp(char **envp)
{
	int		i;
	int		j;
	int		count;
	char	*temp;

	count = 0;
	while (envp[count])
		count++;
	i = 0;
	while (i < count - 1)
	{
		j = 0;
		while (j < count - i - 1)
		{
			if (ft_strcmp(envp[j], envp[j + 1]) > 0)
			{
				temp = envp[j];
				envp[j] = envp[j + 1];
				envp[j + 1] = temp;
			}
			j++;
		}
		i++;
	}
}
