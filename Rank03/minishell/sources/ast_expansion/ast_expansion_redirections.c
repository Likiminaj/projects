/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ast_expansion_redirections.c                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/10 15:31:43 by chlpesty          #+#    #+#             */
/*   Updated: 2026/02/11 16:43:19 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

char	*expand_string(char *str, char **envp, int *exit_stat);
int		str_exp(char *str, char **envp, char **result, int *exit_stat);
void	expansion_error(char *var_name);
char	*ft_charjoin(char *str, char c);

char	*expand_string(char *str, char **envp, int *exit_stat)
{
	char	*result;
	int		i;
	int		expanded_len;

	result = ft_strdup("");
	i = 0;
	while (str[i])
	{
		if (str[i] == '$')
		{
			expanded_len = str_exp(&str[i], envp, &result, exit_stat);
			if (expanded_len == 0)
				return (free(result), NULL);
			i += expanded_len;
		}
		else
		{
			result = ft_charjoin(result, str[i]);
			if (!result)
				return (NULL);
			i++;
		}
	}
	return (result);
}

int	str_exp(char *str, char **envp, char **result, int *exit_stat)
{
	char	*var_name;
	char	*content;
	int		index;
	int		result_len;
	char	*exit_str;

	var_name = find_var_name(str);
	if (!var_name)
		return (0);
	if (var_name[0] == '?' && var_name[1] == '\0')
	{
		exit_str = ft_itoa(*exit_stat);
		*result = ft_strappend(result, exit_str);
		free(exit_str);
		free(var_name);
		return (2);
	}
	index = find_index_in_env(envp, var_name);
	if (index != -1)
	{
		content = find_content(envp[index]);
		*result = ft_strappend(result, content);
		free (content);
	}
	else
		return (expansion_error(var_name), 0);
	result_len = ft_strlen(var_name) + 1;
	free(var_name);
	return (result_len);
}

void	expansion_error(char *var_name)
{
	ft_putstr_fd("minishell: $", 2);
	ft_putstr_fd(var_name, 2);
	ft_putendl_fd(": ambiguous redirect", 2);
}

char	*ft_charjoin(char *str, char c)
{
	char	*new_str;
	int		len;
	int		i;

	len = ft_strlen(str);
	new_str = malloc(len + 2);
	if (!new_str)
		return (NULL);
	i = 0;
	while (str[i])
	{
		new_str[i] = str[i];
		i++;
	}
	new_str[i] = c;
	new_str[i + 1] = '\0';
	free(str);
	return (new_str);
}
